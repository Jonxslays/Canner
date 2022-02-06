import * as vscode from 'vscode';
import { Executor } from './executor';
import { CannerPanel } from './panel';
import { SidebarProvider } from './sidebar';


export function activate(ctx: vscode.ExtensionContext) {
    const window = vscode.window;
    const executor = new Executor(ctx.globalState);
    const sidebarProvider = new SidebarProvider(ctx.extensionUri);

    let sidebar = vscode.window.registerWebviewViewProvider(
        "canner-sidebar", sidebarProvider
    );

    let main = vscode.commands.registerCommand('canner.cannedMain', () => {
        executor.main(window);
    });

    let add = vscode.commands.registerCommand('canner.cannedAdd', async () => {
        await executor.add(window);
    });

    let del = vscode.commands.registerCommand('canner.cannedDelete', () => {
        executor.delete(window);
    });

    let test = vscode.commands.registerCommand('canner.testView', () => {
        CannerPanel.createOrShow(ctx.extensionUri);
    });

    let refresh = vscode.commands.registerCommand('canner.refreshWebview', async () => {
        // CannerPanel.kill();
        // CannerPanel.createOrShow(ctx.extensionUri);
        await vscode.commands.executeCommand("workbench.action.closeSidebar");
        await vscode.commands.executeCommand("workbench.view.extension.canner-sidebar-view");
    });

    ctx.subscriptions.push(sidebar, main, add, del, test, refresh);
}

export function deactivate() {}
