import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';

const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();

// Provider for the Ishihara color blindness test webview
export class IshiharaWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "bolji-pogled_ishihara-webview";

  private _view?: vscode.WebviewView;

  // Initialize the provider with the extension URI
  constructor(private readonly _extensionUri: vscode.Uri) { }

  // Set up the Ishihara test webview
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    // Set webview options and origin
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    // Locate the HTML template file
    const filePath = vscode.Uri.file(
      path.join(this._extensionUri.fsPath, "html", "ishiharaWebview.html")
    );

    // Load and set the webview HTML
    webviewView.webview.html = fs.readFileSync(filePath.fsPath, 'utf8');

    // Handle messages sent from the test webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "changeColorTheme":
          // Update global color theme setting
          await config.update('workbench.colorTheme', data.themeName, vscode.ConfigurationTarget.Global);
          break;
      }
    });
  }
}
