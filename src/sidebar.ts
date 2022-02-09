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
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }

                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }

                case "add-can": {
                    if (!data.name) {
                        vscode.window.showErrorMessage("Cannot create a Can with no name.");
                        return;
                    }

                    if (this.executor.getAllKeys().includes(data.name)) {
                        vscode.window.showErrorMessage(
                            `${data.name} is already defined. Try editing it instead.`
                        );
                        return;
                    }

                    this.executor.add(data.name, data.value);
                    webviewView.webview.postMessage({
                        type: "add-can",
                        value: data.name,
                    });

                    break;
                }

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

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {

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
