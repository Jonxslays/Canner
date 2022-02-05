import * as vscode from 'vscode';
import { StorageImpl } from './storage';


export class Executor {

    private data: StorageImpl;

    constructor(meme: vscode.Memento) {
        this.data = new StorageImpl(meme);
    }

    private async getUserInput(placeholder: string, prompt: string): Promise<string | undefined> {
        const window = vscode.window;

        const buffer = await window.showInputBox({
            placeHolder: placeholder,
            prompt: prompt,
        });

        if (buffer === undefined) {
            return undefined;
        }

        if (buffer === "") {
            window.showErrorMessage("You must enter a value.");
            return undefined;
        }

        return buffer;
    }

    public get(name: string): string {
        return this.data.get(name);
    }

    public getAll() {
        return this.data.getAll();
    }

    public async add(window: typeof vscode.window) {
        const name = await this.getUserInput("Name", "Enter a name for the new Can.");
        if (!name) { return; }

        const value = await this.getUserInput("Text", "Enter the text block for this Can.");
        if (!value) { return; }

        this.data.set(name, value);
        window.showInformationMessage(`Added/updated Can for '${name}'.`);
    }

    public main(window: typeof vscode.window) {
        const quickPick = window.createQuickPick();
        const editor = window.activeTextEditor;

        if (!editor) {
            window.showInformationMessage("You must be using a text editor to use Canner.");
            return;
        }

        quickPick.items = this.getAll().map((item) => ({label: item}));
        quickPick.onDidChangeSelection(([selection]) => {
            if (selection) {
                editor.edit((edit) => {
                    edit.replace(editor.selection, this.get(selection.label));
                });

                quickPick.dispose();
            }
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    }
}
