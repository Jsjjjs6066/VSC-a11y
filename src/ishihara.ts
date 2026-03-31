import * as vscode from 'vscode';
import * as cp from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('ishihara.start', async () => {
        const pythonExtension = vscode.extensions.getExtension('ms-python.python');
        let pythonPath: string = "python";
        if (pythonExtension) {
            const api = await pythonExtension.activate();
            let path: string[] | undefined = api.settings.getExecutionDetails().execCommand;
            if (path) {
                pythonPath = path.join(' ');
            } else {
                return new Promise((resolve) => {
                    cp.exec(process.platform === 'win32' ? 'python --version' : 'python3 --version', (error) => {
                        if (error) {
                            vscode.window.showErrorMessage('Python is not installed or not added to PATH. Please install Python to use this extension.');
                        } else {
                            pythonPath = process.platform === 'win32' ? 'python' : 'python3';
                        }
                    });
                });
            }
        } else {
            const command = process.platform === 'win32' ? 'python --version' : 'python3 --version';

            return new Promise((resolve) => {
                cp.exec(command, (error) => {
                    if (error) {
                        vscode.window.showErrorMessage('Python is not installed or not added to PATH. Please install Python to use this extension.');
                    } else {
                        pythonPath = process.platform === 'win32' ? 'python' : 'python3';
                    }
                });
            });
        }

        const scriptPath = context.asAbsolutePath('Ishihara_test.py');

        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
        vscode.window.activeTerminal?.show();
        terminal.sendText(`${pythonPath} "${scriptPath}"`);
    });

    context.subscriptions.push(disposable);
}