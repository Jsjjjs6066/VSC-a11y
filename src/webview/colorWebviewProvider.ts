import path from "path";
import fs from "fs";
import * as vscode from "vscode";

// Provider for the color configuration webview in the sidebar
export class ColorWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "bolji-pogled.colorWebview";

  private _view?: vscode.WebviewView;
  private _currentErrorHex: string;
  private _currentWarningHex: string;
  private _currentFontSize: number;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _onErrorColorChanged: (hex: string) => Promise<void>,
    private readonly _onWarningColorChanged: (hex: string) => Promise<void>,
    private readonly _onFontSizeChanged: (size: number) => Promise<void>,
    errorColorHex: string,
    warningColorHex: string,
    fontSizeInitial: number
  ) {
    // Store initial state from extension controller
    this._currentErrorHex = errorColorHex;
    this._currentWarningHex = warningColorHex;
    this._currentFontSize = fontSizeInitial;
  }

  // Set up the webview when it's first resolved
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    // Enable scripts and restrict resource access
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    // Construct and set initial HTML content
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, this._currentErrorHex, this._currentWarningHex, this._currentFontSize);

    // Handle messages sent from the HTML/JS side
    webviewView.webview.onDidReceiveMessage(async (data) => {
      console.log('[ColorWebviewProvider] message from webview:', data);
      switch (data.type) {
        case "setErrorColor":
          // Forward error color update to controller
          console.log('[ColorWebviewProvider] setErrorColor ->', data.hex);
          await this._onErrorColorChanged(data.hex);
          break;
        case "setWarningColor":
          // Forward warning color update to controller
          console.log('[ColorWebviewProvider] setWarningColor ->', data.hex);
          await this._onWarningColorChanged(data.hex);
          break;
        case "setFontSize":
          // Locally store and forward font size update
          this._currentFontSize = data.size;
          await this._onFontSizeChanged(data.size);
          break;
        case "resetColors":
          // Trigger global reset command
          console.log('[ColorWebviewProvider] resetColors requested');
          await vscode.commands.executeCommand('bolji-pogled.resetDiagnosticColors');
          break;
      }
    });
  }

  // Push color updates to the webview
  public updateColors(errorHex: string, warningHex: string) {
    this._currentErrorHex = errorHex;
    this._currentWarningHex = warningHex;
    if (this._view) {
      // Send fresh color data to the webview script
      console.log('[ColorWebviewProvider] sending updateColors ->', { errorHex, warningHex });
      this._view.webview.postMessage({
        type: "updateColors",
        errorHex,
        warningHex,
      });
    }
  }

  // Push font size updates to the webview
  public updateFontSize(size: number) {
    this._currentFontSize = size;
    if (this._view) {
      this._view.webview.postMessage({ type: "updateFontSize", size });
    }
  }

  // Generate the HTML content with initial values injected
  private _getHtmlForWebview(webview: vscode.Webview, errorHex: string, warningHex: string, fontSize: number): string {
    // Strip alpha if needed for standard color picker compatibility
    const errorPickerValue = errorHex.length === 9 ? errorHex.slice(0, 7) : errorHex;
    const warningPickerValue = warningHex.length === 9 ? warningHex.slice(0, 7) : warningHex;
    
    // Read the static template from filesystem
    const filePath = vscode.Uri.file(
      path.join(this._extensionUri.fsPath, "src", "webview", "colorWebview.html")
    );
    let s: string = fs.readFileSync(filePath.fsPath, 'utf8');
    
    // Inject dynamic values into the HTML template string
    s = s.replace("{{errorPickerValue}}", errorPickerValue);
    s = s.replace("{{warningPickerValue}}", warningPickerValue);
    s = s.replace("{{fontSize}}", fontSize.toString());
    s = s.replace("{{errorHex}}", errorHex);
    s = s.replace("{{warningHex}}", warningHex);
    
    return s;
  }
}
