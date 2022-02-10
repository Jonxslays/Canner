import * as vscode from "vscode";
import * as fs from "fs";
import { KeyValuePair } from "./types";
import { parse } from "path";


// Main executor of the backend, handles svelte requests.
export class Executor {

    constructor(private data: vscode.Memento) {}

    // Gets all the keys in the global state.
    public keys(): readonly string[] {
        return this.data.keys();
    }

    // Gets all the values in the global state.
    public values(): string[] {
        return this.data.keys().map((key) => this.get(key));
    }

    // Gets all key, value pairs in the global state.
    public items(): KeyValuePair[] {
        let buffer: KeyValuePair[] = [];

         this.data.keys().map((key) => {
            buffer.push({key, value: this.get(key)});
        });

        return buffer;
    }

    // Gets a keys value from the global state.
    public get(key: string): string {
        let obj: string | undefined = this.data.get(key);

        if (obj === undefined) {
            throw new Error(`Failed to get ${key} from storage.`);
        }

        return obj;
    }

    // Adds a key, value pair to the global state.
    public add(key: string, value: string) {
        this.data.update(key, value);
        vscode.window.showInformationMessage(`Added Can for '${key}'.`);
    }

    // Edits a key, value pair in the global state.
    public edit(key: string, value: string) {
        this.data.update(key, value);
        vscode.window.showInformationMessage(`Updated Can '${key}'.`);
    }

    // Deletes a key, value pair from the global state.
    public delete(key: string) {
        this.data.update(key, undefined);
        vscode.window.showInformationMessage(`Deleted '${key}' from saved Cans.`);
    }

    // Reverts the global state given the previous state and the current state.
    public revertState(previous: KeyValuePair[], reverting: KeyValuePair[]) {
        reverting.map((obj) => {
            this.data.update(obj.key, undefined);
        });

        previous.map((obj) => {
            this.data.update(obj.key, obj.value);
        });
    }

    // Logic to import cans from a json file.
    public import(window: typeof vscode.window, webview?: vscode.Webview) {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: "Open",
            filters: { jsonFiles: ["json"] },
        };

        // Let the user choose a file on their machine.
        window.showOpenDialog(options).then(fileUri => {
            if (fileUri && fileUri[0]) {
                let filePath = fileUri[0].fsPath;
                let parsedData: KeyValuePair[] = [];
                let prepared: KeyValuePair[] = [];
                let prevState: KeyValuePair[] = [];
                const nodeUri = filePath.split("/").slice(-1);

                // Read the file.
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        window.showErrorMessage(err.message);
                        return;
                    }

                    try {
                        parsedData = JSON.parse(data.toString());
                    } catch (e: any) {
                        window.showErrorMessage(`Failed to parse json from '${nodeUri}'.`);
                        return;
                    }

                    const lenParsed = parsedData.length;
                    if (lenParsed === 0) {
                        // This file doesn't contain properly formatted values.
                        window.showErrorMessage(`No Cans were found in '${nodeUri}'.`);
                        return;
                    }

                    // Iterate over the parsed data.
                    for (let i = 0; i < lenParsed; i++) {
                        const obj = parsedData[i];

                        // If no key or value, it's bad data, revert the state.
                        if (!obj.key || !obj.value) {
                            window.showErrorMessage(
                                `Failed to parse json from '${nodeUri}': object ${i + 1}, reverting changes.`
                            );

                            this.revertState(prevState, prepared);
                            return;
                        }

                        // Add the current key name to the previous state.
                        const prevObj: string | undefined = this.data.get(obj.key);
                        if (prevObj) {
                            prevState.push({key: obj.key, value: prevObj});
                        }

                        // Add the new key and value to the new state.
                        prepared.push({key: obj.key, value: obj.value});
                    }

                    // Add each item in the new state to the global state.
                    prepared.map((pair) => {
                        this.data.update(pair.key, pair.value);
                    });

                    if (!webview) {
                        // This should hopefully never happen.
                        window.showErrorMessage(
                            "Failed to update webview, but operation completed."
                        );

                        return;
                    }

                    // Send a message to svelte to update the cans.
                    webview.postMessage({
                        type: "all-cans",
                        value: this.data.keys(),
                    });

                    // Nice.
                    window.showInformationMessage(
                        `Successfully imported ${lenParsed} cans from ${nodeUri}`
                    );
                });

            } else {
                // Failed to read or invalid perms or something maybe.
                window.showErrorMessage("Something went wrong importing the file :(.");
            }
        });
    }

    // Creates a quick pick menu for easy access to cans.
    public quickPickify(window: typeof vscode.window, callback: (s: string) => void) {
        const quickPick = window.createQuickPick();

        // Set the quick pick items to all the current keys.
        quickPick.items = this.keys().map((key) => ({label: key}));
        // When an item is selection, invoke the callback func.
        quickPick.onDidChangeSelection(([selection]) => {
            if (selection) {
                callback(selection.label);
                quickPick.dispose();
            }
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
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
