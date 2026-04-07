import * as vscode from 'vscode';
import { activate as activateNoLines } from './no_lines';
import { activate as activateColors } from './colors';
import { activate as activateSize } from './size';
import { IshiharaWebviewProvider } from './webview/ishiharaWebviewProvider';

// Main activation for all extension sub-modules
export function activate(context: vscode.ExtensionContext) {
	// Initialize border around errors and warnings
	activateNoLines(context);
	// Initialize color picker for errors and warnings
	activateColors(context);
	// Initialize font size picker for terminal and debug console
	activateSize(context);

	// Initialize the Ishihara test provider
	const ishiharaProvider = new IshiharaWebviewProvider(context.extensionUri);
	
	// Register the Ishihara webview sidebar
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			IshiharaWebviewProvider.viewType,
			ishiharaProvider
		)
	);
}

// Cleanup logic for extension deactivation
export function deactivate() { }
