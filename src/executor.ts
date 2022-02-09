import * as vscode from 'vscode';


// Main executor of the backend, handles svelte requests.
export class Executor {

    constructor(private data: vscode.Memento) {}

    // Gets a key from the global state.
    public get(key: string): string {
        let obj: string | undefined = this.data.get(key);

        if (obj === undefined) {
            throw new Error(`Failed to get ${key} from storage.`);
        }

        return obj;
    }

    // Gets all the keys in the global state.
    public keys(): readonly string[] {
        return this.data.keys();
    }

    // Adds a key to the global state.
    public add(key: string, value: string) {
        this.data.update(key, value);
        vscode.window.showInformationMessage(`Added Can for '${key}'.`);
    }

    // Edits a key in the global state.
    public edit(key: string, value: string) {
        this.data.update(key, value);
        vscode.window.showInformationMessage(`Updated Can '${key}'.`);
    }

    // Creates a quick pick menu for easy access to cans.
    public quickPickify(window: typeof vscode.window, callback: (s: string) => void) {
        const quickPick = window.createQuickPick();

        quickPick.items = this.keys().map((key) => ({label: key}));
        quickPick.onDidChangeSelection(([selection]) => {
            if (selection) {
                callback(selection.label);
                quickPick.dispose();
            }
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    }

    // Deletes a key from the global state.
    public delete(key: string) {
        this.data.update(key, undefined);
        vscode.window.showInformationMessage(`Deleted '${key}' from saved Cans.`);
    }

    // Executes a text insertion using a quick pick menu.
    public main(window: typeof vscode.window) {
        const editor = window.activeTextEditor;

        // We cant replace text if they aren't using an editor.
        if (!editor) {
            window.showInformationMessage("You must be using a text editor to use this command.");
            return;
        }

        // Start the quick pick menu.
        this.quickPickify(window, async (selection) => {
            // Insert the value for the selection, gotten from global state.
            editor.edit((edit) => {
                edit.replace(editor.selection, this.get(selection));
            });

            // Prevents all the text from being highlighted afterwards.
            await vscode.commands.executeCommand("cursorMove", {
                to: "wrappedLineEnd",
                by: "wrappedLine",
            });
        });
    }
}
