import * as vscode from 'vscode';
import { Executor } from './executor';


export function activate(ctx: vscode.ExtensionContext) {
    const window = vscode.window;
    const executor = new Executor(ctx.globalState);

    let main = vscode.commands.registerCommand('vs-text-macros.cannedMain', () => {
        executor.main(window);
    });

    let add = vscode.commands.registerCommand('vs-text-macros.cannedAdd', async () => {
        await executor.add(window);
    });

    let del = vscode.commands.registerCommand('vs-text-macros.cannedDelete', () => {
        executor.delete(window);
    });

    ctx.subscriptions.push(main, add, del);
}

export function deactivate() {}
