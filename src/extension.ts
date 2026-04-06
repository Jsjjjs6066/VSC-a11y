import * as vscode from 'vscode';
import { activate as activateNoLines } from './no_lines';
import { activate as activateColors } from './colors';
import { activate as activateSize } from './size';
import { IshiharaWebviewProvider } from './webview/ishiharaWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
	activateNoLines(context);
	activateColors(context);
	activateSize(context);

	const ishiharaProvider = new IshiharaWebviewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			IshiharaWebviewProvider.viewType,
			ishiharaProvider
		)
	);
}

export function deactivate() {}
