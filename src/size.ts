import * as vscode from 'vscode';

// Configuration keys for accessibility settings
const CONFIG_SECTION = 'a11ySettings';
const FONT_SIZE_KEY = 'minFontSize';
// Default font size if none is configured
export const DEFAULT_MIN_FONT_SIZE = 20;

// Apply font size to debug console and terminal
function applyMinFontSize(minSize: number) {
    // Update debug console font size
    vscode.workspace.getConfiguration('debug').update('console.fontSize', minSize);
    // Update integrated terminal font size
    vscode.workspace.getConfiguration('terminal').update('integrated.fontSize', minSize);
}

// Get current minimum font size from config
export function getMinFontSize(): number {
    return vscode.workspace.getConfiguration(CONFIG_SECTION).get<number>(FONT_SIZE_KEY, DEFAULT_MIN_FONT_SIZE);
}

// Save new minimum font size and apply it
export async function setMinFontSize(size: number): Promise<void> {
    await vscode.workspace.getConfiguration(CONFIG_SECTION).update(FONT_SIZE_KEY, size, vscode.ConfigurationTarget.Global);
    applyMinFontSize(size);
}

// Initialize font size module
export function activate(context: vscode.ExtensionContext) {
    // Apply initial font size on activation
    applyMinFontSize(getMinFontSize());

    // Listen for font size configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('a11ySettings.minFontSize')) {
                applyMinFontSize(getMinFontSize());
            }
        })
    );
}
