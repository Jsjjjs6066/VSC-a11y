import * as vscode from "vscode";

export class ColorWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "bolji-pogled.colorWebview";

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _onErrorColorChanged: (hex: string) => Promise<void>,
    private readonly _onWarningColorChanged: (hex: string) => Promise<void>,
    private readonly _errorColorHex: string,
    private readonly _warningColorHex: string
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            console.log('[ColorWebviewProvider] message from webview:', data);
            switch (data.type) {
                case "setErrorColor":
                    console.log('[ColorWebviewProvider] setErrorColor ->', data.hex);
                    await this._onErrorColorChanged(data.hex);
                    break;
                case "setWarningColor":
                    console.log('[ColorWebviewProvider] setWarningColor ->', data.hex);
                    await this._onWarningColorChanged(data.hex);
                    break;
                case "resetColors":
                    console.log('[ColorWebviewProvider] resetColors requested');
                    await vscode.commands.executeCommand('bolji-pogled.resetDiagnosticColors');
                    break;
            }
        });
  }

  public updateColors(errorHex: string, warningHex: string) {
    if (this._view) {
            console.log('[ColorWebviewProvider] sending updateColors ->', { errorHex, warningHex });
            this._view.webview.postMessage({
                type: "updateColors",
                errorHex,
                warningHex,
            });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Color Configuration</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
        }

        .container {
            max-width: 400px;
        }

        h2 {
            margin-top: 0;
            margin-bottom: 20px;
            font-size: 18px;
            color: var(--vscode-foreground);
        }

        .color-section {
            margin-bottom: 30px;
            padding: 15px;
            border: 1px solid var(--vscode-sideBar-border);
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
        }

        .color-section h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .color-group {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }

        .color-picker-wrapper {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
        }

        label {
            font-size: 12px;
            font-weight: 500;
            color: var(--vscode-descriptionForeground);
        }

        input[type="color"] {
            width: 80px;
            height: 80px;
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            cursor: pointer;
            padding: 4px;
        }

        .input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
        }

        input[type="text"] {
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 12px;
            font-family: 'Courier New', monospace;
        }

        input[type="text"]:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }

        .presets {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 15px;
        }

        .preset-btn {
            aspect-ratio: 1;
            border: 2px solid var(--vscode-button-border);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            padding: 0;
        }

        .preset-btn:hover {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 2px var(--vscode-focusBorder);
            transform: scale(1.05);
        }

        .color-display {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background-color: var(--vscode-input-background);
            border-radius: 4px;
            margin-top: 10px;
        }

        .color-preview {
            width: 30px;
            height: 30px;
            border-radius: 4px;
            border: 1px solid var(--vscode-button-border);
        }

        .color-value {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            flex: 1;
        }

        .reset-btn {
            width: 100%;
            padding: 10px;
            margin-top: 20px;
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
        }

        .reset-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .reset-btn:active {
            background-color: var(--vscode-button-background);
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Diagnostic Colors</h2>

        <!-- Error Color Section -->
        <div class="color-section">
            <h3>Error Color</h3>
            <div class="presets" id="errorPresets"></div>
            <div class="color-group">
                <div class="color-picker-wrapper">
                    <label for="errorColorPicker">Pick color:</label>
                    <input type="color" id="errorColorPicker">
                </div>
                <div class="input-group">
                    <label for="errorHexInput">Hex code:</label>
                    <input type="text" id="errorHexInput" placeholder="#RRGGBB">
                </div>
            </div>
            <div class="color-display">
                <div class="color-preview" id="errorPreview"></div>
                <span class="color-value" id="errorValue"></span>
            </div>
        </div>

        <!-- Warning Color Section -->
        <div class="color-section">
            <h3>Warning Color</h3>
            <div class="presets" id="warningPresets"></div>
            <div class="color-group">
                <div class="color-picker-wrapper">
                    <label for="warningColorPicker">Pick color:</label>
                    <input type="color" id="warningColorPicker">
                </div>
                <div class="input-group">
                    <label for="warningHexInput">Hex code:</label>
                    <input type="text" id="warningHexInput" placeholder="#RRGGBB">
                </div>
            </div>
            <div class="color-display">
                <div class="color-preview" id="warningPreview"></div>
                <span class="color-value" id="warningValue"></span>
            </div>
        </div>

        <button class="reset-btn" id="resetBtn">Reset to Defaults</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        const PALETTE = [
            { name: "Pink", hex: "#D81B60" },
            { name: "Orange", hex: "#B26A00" },
            { name: "Yellow", hex: "#FFD166" },
            { name: "Blue", hex: "#0077B6" },
            { name: "Cyan", hex: "#1E9FB8" },
            { name: "Purple", hex: "#6D28D9" },
            { name: "Gray", hex: "#6B7280" },
            { name: "Black", hex: "#000000" },
            { name: "White", hex: "#FFFFFF" }
        ];

        // Initialize preset buttons
        function initializePresets() {
            const errorPresetsContainer = document.getElementById('errorPresets');
            const warningPresetsContainer = document.getElementById('warningPresets');

            PALETTE.forEach(color => {
                const errorBtn = createPresetButton(color, 'error');
                const warningBtn = createPresetButton(color, 'warning');
                errorPresetsContainer.appendChild(errorBtn);
                warningPresetsContainer.appendChild(warningBtn);
            });
        }

        function createPresetButton(color, type) {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.style.backgroundColor = color.hex;
            btn.title = color.name;
            btn.onclick = () => setColor(type, color.hex);
            return btn;
        }

        // Color picker inputs
        document.getElementById('errorColorPicker').addEventListener('input', (e) => {
            console.log('[webview] errorColorPicker input ->', e.target.value);
            setColor('error', e.target.value);
        });

        document.getElementById('warningColorPicker').addEventListener('input', (e) => {
            console.log('[webview] warningColorPicker input ->', e.target.value);
            setColor('warning', e.target.value);
        });

        // Hex input fields
        document.getElementById('errorHexInput').addEventListener('change', (e) => {
            console.log('[webview] errorHexInput change ->', e.target.value);
            setColor('error', e.target.value);
        });

        document.getElementById('warningHexInput').addEventListener('change', (e) => {
            console.log('[webview] warningHexInput change ->', e.target.value);
            setColor('warning', e.target.value);
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'resetColors' });
        });

        function setColor(type, hex) {
            if (!hex) return;
            // normalize leading '#'
            if (!hex.startsWith('#')) hex = '#' + hex;
            // accept #RRGGBB or #RRGGBBAA
            if (!/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex)) return;

            const pickerId = type === 'error' ? 'errorColorPicker' : 'warningColorPicker';
            const inputId = type === 'error' ? 'errorHexInput' : 'warningHexInput';
            const previewId = type === 'error' ? 'errorPreview' : 'warningPreview';
            const valueId = type === 'error' ? 'errorValue' : 'warningValue';

            // color input only supports #RRGGBB — drop alpha for the picker
            const pickerValue = hex.length === 9 ? hex.slice(0, 7) : hex;

            document.getElementById(pickerId).value = pickerValue;
            document.getElementById(inputId).value = hex.toUpperCase();
            document.getElementById(previewId).style.backgroundColor = hex;
            document.getElementById(valueId).textContent = hex.toUpperCase();

            vscode.postMessage({
                type: type === 'error' ? 'setErrorColor' : 'setWarningColor',
                hex: hex.toUpperCase()
            });
        }

        // Handle messages from extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            console.log('[webview] message from extension ->', message);
            if (message.type === 'updateColors') {
                updateColorDisplay('error', message.errorHex);
                updateColorDisplay('warning', message.warningHex);
            }
        });

        function updateColorDisplay(type, hex) {
            const pickerId = type === 'error' ? 'errorColorPicker' : 'warningColorPicker';
            const inputId = type === 'error' ? 'errorHexInput' : 'warningHexInput';
            const previewId = type === 'error' ? 'errorPreview' : 'warningPreview';
            const valueId = type === 'error' ? 'errorValue' : 'warningValue';

            // update color picker with #RRGGBB only
            const pickerValue = hex.length === 9 ? hex.slice(0, 7) : hex;
            document.getElementById(pickerId).value = pickerValue;
            document.getElementById(inputId).value = hex;
            document.getElementById(previewId).style.backgroundColor = hex;
            document.getElementById(valueId).textContent = hex;
        }

        // Initialize on load
        initializePresets();
    </script>
</body>
</html>`;
  }
}
