import * as vscode from 'vscode';

export let errorColor: vscode.Color = {
    red: 1,
    green: 0,
    blue: 0,
    alpha: 1
};
export let warningColor: vscode.Color = {
    red: 1,
    green: 1,
    blue: 0,
    alpha: 1
};

export function activate(context: vscode.ExtensionContext) {
    // ...
}