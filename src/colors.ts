import * as vscode from "vscode";
// Import color state and persistence logic
import {
  errorColor,
  warningColor,
  loadColorsFromConfig,
  setErrorColorHex,
  setWarningColorHex,
  resetDiagnosticColors,
  vscodeColorToHex,
  isValidHexColor
} from "./test/colors";
// Import font size utilities
import { getMinFontSize, setMinFontSize } from "./size";
// Import main configuration webview provider
import { ColorWebviewProvider } from "./webview/colorWebviewProvider";

// Simple color choice type for picking diagnostic colors
type ColorChoice = { label: string; description: string; hex?: string };

// Pre-configured color palette
const PALETTE: { name: string; hex: string }[] = [
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

// Reference to the sidebar webview
let webviewProvider: ColorWebviewProvider | undefined;

// Initialize coloring module and register commands
export function activate(context: vscode.ExtensionContext) {
  // Load initial colors from VS Code settings
  loadColorsFromConfig();

  // Convert current colors to hex for webview display
  const errHex = vscodeColorToHex(errorColor);
  const warnHex = vscodeColorToHex(warningColor);

  // Create sidebar webview provider for colors and font size configuration
  webviewProvider = new ColorWebviewProvider(
    context.extensionUri,
    setErrorColorHexAndNotify,
    setWarningColorHexAndNotify,
    setFontSizeAndNotify,
    errHex,
    warnHex,
    getMinFontSize()
  );

  // Register the webview sidebar view
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ColorWebviewProvider.viewType,
      webviewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Register command to open the full configuration menu
  context.subscriptions.push(
    vscode.commands.registerCommand("bolji-pogled.configureDiagnosticColors", async () => {
      await openMenu();
    })
  );

  // Register individual color picker commands
  context.subscriptions.push(
    vscode.commands.registerCommand("bolji-pogled.setErrorColor", async () => {
      await pickAndSetColor("error");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("bolji-pogled.setWarningColor", async () => {
      await pickAndSetColor("warning");
    })
  );

  // Register command to reset all accessibility colors
  context.subscriptions.push(
    vscode.commands.registerCommand("bolji-pogled.resetDiagnosticColors", async () => {
      await resetDiagnosticColors();
      vscode.window.showInformationMessage("A11Y: colors reset.");
      updateWebviewColors();
    })
  );

  // Listen for configuration changes to update the UI
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("bolji-pogled.errorColor") ||
        e.affectsConfiguration("bolji-pogled.warningColor")
      ) {
        loadColorsFromConfig();
        updateWebviewColors();
      }
      if (e.affectsConfiguration("bolji-pogled.minFontSize")) {
        webviewProvider?.updateFontSize(getMinFontSize());
      }
    })
  );
}

// Set error color and inform webview to change color container
async function setErrorColorHexAndNotify(hex: string): Promise<void> {
  console.log('[colors] setErrorColorHexAndNotify ->', hex);
  await setErrorColorHex(hex);
  updateWebviewColors();
}

// Update minimum font size for terminal
async function setFontSizeAndNotify(size: number): Promise<void> {
  await setMinFontSize(size);
  webviewProvider?.updateFontSize(size);
}

// Set warning color and inform webview to change color container
async function setWarningColorHexAndNotify(hex: string): Promise<void> {
  console.log('[colors] setWarningColorHexAndNotify ->', hex);
  await setWarningColorHex(hex);
  updateWebviewColors();
}

// Update settings view with current colors
function updateWebviewColors(): void {
  if (webviewProvider) {
    const errHex = vscodeColorToHex(errorColor);
    const warnHex = vscodeColorToHex(warningColor);
    webviewProvider.updateColors(errHex, warnHex);
  }
}

// Open menu to configure colors
async function openMenu(): Promise<void> {
  // Get latest color hex codes
  const errHex = vscodeColorToHex(errorColor);
  const warnHex = vscodeColorToHex(warningColor);

  // Prompt user with curated action items
  const items = [
    { label: "Set error color", description: `Current: ${errHex}`, action: "error" as const },
    { label: "Set warning color", description: `Current: ${warnHex}`, action: "warning" as const },
    { label: "Reset colors", description: "Restore defaults", action: "reset" as const }
  ];

  const pick = await vscode.window.showQuickPick(items, { placeHolder: "Configure diagnostic colors" });
  if (!pick) {
    return;
  }

  // Route action based on user selection
  if (pick.action === "error") {
    return pickAndSetColor("error");
  }
  if (pick.action === "warning") {
    return pickAndSetColor("warning");
  }

  await resetDiagnosticColors();
  vscode.window.showInformationMessage("A11Y: colors reset.");
}

// Dialog to pick and apply color
async function pickAndSetColor(kind: "error" | "warning"): Promise<void> {
  const current = kind === "error" ? vscodeColorToHex(errorColor) : vscodeColorToHex(warningColor);

  const choices: ColorChoice[] = [
    ...PALETTE.map((p) => ({ label: p.name, description: p.hex, hex: p.hex })),
    { label: "Custom hex...", description: "Enter #RRGGBB or #RRGGBBAA" }
  ];

  // Prompt user with color options
  const pick = await vscode.window.showQuickPick(choices, {
    placeHolder: `Pick a ${kind} color (current: ${current})`,
    matchOnDescription: true
  });
  if (!pick) {
    return;
  }

  let hex = pick.hex;

  // Handle custom hex input option
  if (!hex) {
    const input = await vscode.window.showInputBox({
      prompt: `Enter ${kind} color hex (#RRGGBB or #RRGGBBAA)`,
      value: current,
      validateInput: (val) => (isValidHexColor(val) ? undefined : "Invalid hex format.")
    });
    if (!input) {
      return;
    }
    hex = input;
  }

  // Apply the selected color to VS Code settings
  if (kind === "error") {
    await setErrorColorHex(hex);
    vscode.window.showInformationMessage(`A11Y: errorColor = ${hex.toUpperCase()}`);
  } else {
    await setWarningColorHex(hex);
    vscode.window.showInformationMessage(`A11Y: warningColor = ${hex.toUpperCase()}`);
  }
}

export { errorColor, warningColor } from "./test/colors";
