import * as vscode from 'vscode';


export class StorageImpl {

    constructor(private data: vscode.Memento) {}

    public get(key: string): string {
        let obj: string | undefined = this.data.get(key);

        if (obj === undefined) {
            throw new Error(`Failed to get ${key} from storage.`);
        }

        return obj;
    }

    public set(key: string, value: string) {
        this.data.update(key, value);
    }

    public getAll(): Array<string> {
        let buffer: Array<string> = [];

        this.data.keys().forEach((item) => {
            buffer.push(item);
        });

        return buffer;
    }
}
