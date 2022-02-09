import * as _vscode from "vscode";
import { Executor } from "../src/executor";

declare global {
    const svscode: {
        postMessage: ({
            type: string,
            value: string,
            name: string = "",
        }) => void;
    };

    const executor: Executor;
}
