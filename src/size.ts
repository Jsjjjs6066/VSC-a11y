import * as vscode from 'vscode';

const CONFIG_SECTION = 'a11ySettings';
const FONT_SIZE_KEY = 'minFontSize';
export const DEFAULT_MIN_FONT_SIZE = 20;

function applyMinFontSize(minSize: number) {
    vscode.workspace.getConfiguration('debug').update('console.fontSize', minSize);
    vscode.workspace.getConfiguration('terminal').update('integrated.fontSize', minSize);
}

export function getMinFontSize(): number {
    return vscode.workspace.getConfiguration(CONFIG_SECTION).get<number>(FONT_SIZE_KEY, DEFAULT_MIN_FONT_SIZE);
}

export async function setMinFontSize(size: number): Promise<void> {
    await vscode.workspace.getConfiguration(CONFIG_SECTION).update(FONT_SIZE_KEY, size, vscode.ConfigurationTarget.Global);
    applyMinFontSize(size);
}

export function activate(context: vscode.ExtensionContext) {
    applyMinFontSize(getMinFontSize());

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('a11ySettings.minFontSize')) {
                applyMinFontSize(getMinFontSize());
            }
        })
    );
}
