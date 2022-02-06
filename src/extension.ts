import * as vscode from 'vscode';
import { Executor } from './executor';
import { CannerPanel } from './panel';


export function activate(ctx: vscode.ExtensionContext) {
    const window = vscode.window;
    const executor = new Executor(ctx.globalState);

    let main = vscode.commands.registerCommand('canner.cannedMain', () => {
        executor.main(window);
    });

    let add = vscode.commands.registerCommand('canner.cannedAdd', async () => {
        await executor.add(window);
    });

    let del = vscode.commands.registerCommand('canner.cannedDelete', () => {
        executor.delete(window);
    });

    let edit = vscode.commands.registerCommand('canner.cannedEdit', () => {
        CannerPanel.createOrShow(ctx.extensionUri);
    });

    let refresh = vscode.commands.registerCommand('canner.refreshWebview', () => {
        CannerPanel.kill();
        CannerPanel.createOrShow(ctx.extensionUri);
    });

    ctx.subscriptions.push(main, add, del, edit, refresh);
}

export function deactivate() {}
