import * as vscode from 'vscode';
import { StorageImpl } from './storage';


export class Executor {

    private data: StorageImpl;

    constructor(meme: vscode.Memento) {
        this.data = new StorageImpl(meme);
    }

    public async getUserInput(placeholder: string, prompt: string): Promise<string | undefined> {
        const window = vscode.window;

        const buffer = await window.showInputBox({
            placeHolder: placeholder,
            prompt: prompt,
        });

        if (buffer === "") {
            window.showErrorMessage("You must enter a value.");
            return undefined;
        }

        return buffer;
    }

    public get(name: string): string {
        return this.data.get(name);
    }

    public getAllKeys(): readonly string[] {
        return this.data.getAllKeys();
    }

    public add(name: string, value: string) {
        this.data.set(name, value);
        vscode.window.showInformationMessage(`Added Can for '${name}'.`);
    }

    public quickPickify(window: typeof vscode.window, callback: (s: string) => void) {
        const quickPick = window.createQuickPick();

        quickPick.items = this.getAllKeys().map((key) => ({label: key}));
        quickPick.onDidChangeSelection(([selection]) => {
            if (selection) {
                callback(selection.label);
                quickPick.dispose();
            }
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    }

    public delete(window: typeof vscode.window) {
        this.quickPickify(window, (selection) => {
            this.data.delete(selection);
            window.showInformationMessage(`Deleted '${selection}' from saved Cans.`);
        });
    }

    public main(window: typeof vscode.window) {
        const editor = window.activeTextEditor;

        if (!editor) {
            window.showInformationMessage("You must be using a text editor to use this command.");
            return;
        }

        this.quickPickify(window, async (selection) => {
            editor.edit((edit) => {
                edit.replace(editor.selection, this.get(selection));
            });

            await vscode.commands.executeCommand("cursorMove", {
                to: "wrappedLineEnd",
                by: "wrappedLine",
            });
        });
    }
}
