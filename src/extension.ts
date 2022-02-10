import * as vscode from "vscode";
import { Executor } from "./executor";
import { SidebarProvider } from "./sidebar";


export function activate(ctx: vscode.ExtensionContext) {
    const window = vscode.window;
    // Executes interactions with the storage implementation.
    const executor = new Executor(ctx.globalState);
    // Provides the Canner sidebar icon and panel.
    const sidebarProvider = new SidebarProvider(ctx.extensionUri, executor);

    // Registers the sidebar webview.
    let sidebar = vscode.window.registerWebviewViewProvider(
        "canner-sidebar", sidebarProvider
    );

    // Registers the main command.
    let main = vscode.commands.registerCommand("canner.cannedMain", () => {
        executor.main(window);
    });

    // Registers the import command.
    let import_ = vscode.commands.registerCommand("canner.cannedImport", () => {
        executor.import(window, sidebarProvider._view?.webview);

    });

    // // Development refresh command.
    // let refresh = vscode.commands.registerCommand('canner.refreshWebview', async () => {
    //     await vscode.commands.executeCommand("workbench.action.closeSidebar");
    //     await vscode.commands.executeCommand("workbench.view.extension.canner-sidebar-view");
    // });

    // Subscribe to both command and webview.
    ctx.subscriptions.push(sidebar, main, import_);
}

// c'est la vie
export function deactivate() {}
