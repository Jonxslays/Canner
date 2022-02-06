import * as vscode from "vscode";
import { generateNonce } from "./nonce";

export class CannerPanel {

    public static currentPanel: CannerPanel | undefined;
    public static readonly viewType = "Canner";
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (CannerPanel.currentPanel) {
            CannerPanel.currentPanel._panel.reveal(column);
            CannerPanel.currentPanel._update();
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            CannerPanel.viewType,
            "canner",
            column || vscode.ViewColumn.One,
            {
                // Enable js in the webview.
                enableScripts: true,

                // Restrict webview content directories.
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "frontend"),
                    vscode.Uri.joinPath(extensionUri, "out/compiled"),
                ],
            }
        );

        CannerPanel.currentPanel = new CannerPanel(panel, extensionUri);
    }

    public static kill() {
        CannerPanel.currentPanel?.dispose();
        CannerPanel.currentPanel = undefined;
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        CannerPanel.currentPanel = new CannerPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // // Handle messages from the webview
        // this._panel.webview.onDidReceiveMessage(
        //   (message) => {
        //     switch (message.command) {
        //       case "alert":
        //         vscode.window.showErrorMessage(message.text);
        //         return;
        //     }
        //   },
        //   null,
        //   this._disposables
        // );
    }

    public dispose() {
        CannerPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);

        webview.onDidReceiveMessage(async (data) => {
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
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Loads javascript into webview
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out/compiled", "test.js")
        );

        // Loads styles into webview
        const stylesResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "frontend", "reset.css")
        );

        const stylesMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "frontend", "vscode.css")
        );

        const cssUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out/compiled", "home.css")
        );

        // Use a nonce for security
        const nonce = generateNonce();

        return `<!DOCTYPE html>
            <html lang="en">

            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
                webview.cspSource
            }; script-src 'nonce-${nonce}';">

            <link href="${stylesResetUri}" rel="stylesheet">
            <link href="${stylesMainUri}" rel="stylesheet">
            </head>

            <body>
            </body>

            <script src="${scriptUri}" nonce="${nonce}"></script>
            </html>`;
    }
}
