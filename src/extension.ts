import * as vscode from 'vscode';


class StorageImpl {

    constructor(private data: vscode.Memento) {}

    public get(key: string): string {
        let obj: string | undefined = this.data.get(key);

        if (obj === undefined) {
            throw new Error(`Failed to get ${key} from storage.`);
        }

        return obj;
    }

    public set(key: string, value: string) {
        this.data.update(key, value);
    }

    public getAll(): Array<string> {
        let buffer: Array<string> = [];

        this.data.keys().forEach((item) => {
            buffer.push(item);
        });

        return buffer;
    }
}

class Executor {

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
        const name = await this.getUserInput("Name", "Enter a name for the new canned response.");
        if (!name) { return; }

        const value = await this.getUserInput("Text", "Enter the text block for this canned response.");
        if (!value) { return; }

        window.showInformationMessage(`Setting name '${name}' to '${value}'`);
        this.data.set(name, value);
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

export function activate(ctx: vscode.ExtensionContext) {
    const window = vscode.window;
    const executor = new Executor(ctx.globalState);

    let main = vscode.commands.registerCommand('vs-text-macros.cannedMain', () => {
        executor.main(window);
        // edit.replace(editor.selection, thing);
    });

    let add = vscode.commands.registerCommand('vs-text-macros.cannedAdd', async () => {
        await executor.add(window);
    });

    ctx.subscriptions.push(main, add);
}

export function deactivate() {}
