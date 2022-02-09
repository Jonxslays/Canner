import * as vscode from "vscode";
import { Executor } from "./executor";
import { generateNonce } from "./nonce";


export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;

    constructor(private readonly _extensionUri: vscode.Uri, private executor: Executor) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview.
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                // Shows info messages from svelte.
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }

                    vscode.window.showInformationMessage(data.value);
                    break;
                }

                // Shows error messages from svelte.
                case "onError": {
                    if (!data.value) {
                        return;
                    }

                    vscode.window.showErrorMessage(data.value);
                    break;
                }

                // Add a new can.
                case "add-can": {

                    // This can exists, should we edit it?
                    if (this.executor.getAllKeys().includes(data.name)) {
                        const edit = await vscode.window.showErrorMessage(
                            `${data.name} exists. Edit it instead?`,
                            "Yes",
                            "No",
                        );

                        // If no, return and do nothing.
                        if (!edit || edit === "No") {
                            return;
                        }

                        // If yes, edit the can.
                        this.executor.edit(data.name, data.value);
                        webviewView.webview.postMessage({
                            type: "edit-can",
                            value: data.name,
                        });

                        break;
                    }

                    // Add the new can.
                    this.executor.add(data.name, data.value);
                    // Let svelte know we were successful.
                    webviewView.webview.postMessage({
                        type: "add-can",
                        value: data.name,
                    });

                    break;
                }

                // Edit an existing can.
                case "edit-can": {

                    // This can doesn't exist, should we create it?
                    if (!this.executor.getAllKeys().includes(data.name)) {
                        const create = await vscode.window.showErrorMessage(
                            `${data.name} doesn't exist. Create it now?`,
                            "Yes",
                            "No",
                        );

                        // If no, return and do nothing.
                        if (!create || create === "No") {
                            return;
                        }

                        // If yes, add the new can.
                        this.executor.add(data.name, data.value);
                        // Let svelte know we were successful.
                        webviewView.webview.postMessage({
                            type: "add-can",
                            value: data.name,
                        });

                        break;
                    }

                    // Edit the can.
                    this.executor.edit(data.name, data.value);
                    // Let svelte know we were successful.
                    webviewView.webview.postMessage({
                        type: "edit-can",
                        value: data.name,
                    });

                    break;
                }

                // Delete a can.
                case "del-can": {

                    // This can doesn't exist, we can't delete it.
                    if (!this.executor.getAllKeys().includes(data.value)) {
                        vscode.window.showErrorMessage(
                            `${data.value} can't be deleted, it doesn't exist.`
                        );

                        return;
                    }

                    // Perform the deletion.
                    this.executor.delete(data.value);
                    // Let svelte know we were successful.
                    webviewView.webview.postMessage({
                        type: "del-can",
                        value: data.value,
                    });

                    break;
                }

                // Send all the cans to svelte.
                case "get-can-names": {
                    webviewView.webview.postMessage({
                        type: "all-cans",
                        value: this.executor.getAllKeys(),
                    });

                    break;
                }
            }
        });
    }

    // Bring the panel back to life.
    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    // The real worker of the sidebar.
    private _getHtmlForWebview(webview: vscode.Webview) {

        // Define style and script uris.
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "frontend", "reset.css")
        );

        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "frontend", "vscode.css")
        );

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
        );

        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
        );

    // Use a nonce for security.
    const nonce = generateNonce();

    // Page HTML, svelte will fill the body tags.
    return `<!DOCTYPE html>
        <html lang="en">

        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
            webview.cspSource
        }; script-src 'nonce-${nonce}';">

        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">

        <script nonce="${nonce}">
            const svscode = acquireVsCodeApi();
        </script>
		</head>

        <body>
        </body>

        <script nonce="${nonce}" src="${scriptUri}"></script>
        </html>`;
    }
}
