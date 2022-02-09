import * as _vscode from "vscode";
import { Executor } from "../src/executor";

declare global {
    const svscode: {
        postMessage: ({
            type: string, value: any, success: boolean = undefined,
        }) => void;
    };

    const executor: Executor;
}
