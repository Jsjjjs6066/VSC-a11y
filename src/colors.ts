import * as vscode from "vscode";
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
import { ColorWebviewProvider } from "./webview/colorWebviewProvider";

type ColorChoice = { label: string; description: string; hex?: string };

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

let webviewProvider: ColorWebviewProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  loadColorsFromConfig();

  // Register the webview view provider
  const errHex = vscodeColorToHex(errorColor);
  const warnHex = vscodeColorToHex(warningColor);

  webviewProvider = new ColorWebviewProvider(
    context.extensionUri,
    setErrorColorHexAndNotify,
    setWarningColorHexAndNotify,
    errHex,
    warnHex
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ColorWebviewProvider.viewType,
      webviewProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("bolji-pogled.configureDiagnosticColors", async () => {
      await openMenu();
    })
  );

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

  context.subscriptions.push(
    vscode.commands.registerCommand("bolji-pogled.resetDiagnosticColors", async () => {
      await resetDiagnosticColors();
      vscode.window.showInformationMessage("bolji_pogled: colors reset.");
      updateWebviewColors();
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("bolji-pogled.errorColor") ||
        e.affectsConfiguration("bolji-pogled.warningColor")
      ) {
        loadColorsFromConfig();
        updateWebviewColors();
      }
    })
  );
}

async function setErrorColorHexAndNotify(hex: string): Promise<void> {
  console.log('[colors] setErrorColorHexAndNotify ->', hex);
  await setErrorColorHex(hex);
  updateWebviewColors();
}

async function setWarningColorHexAndNotify(hex: string): Promise<void> {
  console.log('[colors] setWarningColorHexAndNotify ->', hex);
  await setWarningColorHex(hex);
  updateWebviewColors();
}

function updateWebviewColors(): void {
  if (webviewProvider) {
    const errHex = vscodeColorToHex(errorColor);
    const warnHex = vscodeColorToHex(warningColor);
    webviewProvider.updateColors(errHex, warnHex);
  }
}

async function openMenu(): Promise<void> {
  const errHex = vscodeColorToHex(errorColor);
  const warnHex = vscodeColorToHex(warningColor);

  const items = [
    { label: "Set error color", description: `Current: ${errHex}`, action: "error" as const },
    { label: "Set warning color", description: `Current: ${warnHex}`, action: "warning" as const },
    { label: "Reset colors", description: "Restore defaults", action: "reset" as const }
  ];

  const pick = await vscode.window.showQuickPick(items, { placeHolder: "Configure diagnostic colors" });
  if (!pick) return;

  if (pick.action === "error") return pickAndSetColor("error");
  if (pick.action === "warning") return pickAndSetColor("warning");

  await resetDiagnosticColors();
  vscode.window.showInformationMessage("bolji_pogled: colors reset.");
}

async function pickAndSetColor(kind: "error" | "warning"): Promise<void> {
  const current = kind === "error" ? vscodeColorToHex(errorColor) : vscodeColorToHex(warningColor);

  const choices: ColorChoice[] = [
    ...PALETTE.map((p) => ({ label: p.name, description: p.hex, hex: p.hex })),
    { label: "Custom hex...", description: "Enter #RRGGBB or #RRGGBBAA" }
  ];

  const pick = await vscode.window.showQuickPick(choices, {
    placeHolder: `Pick a ${kind} color (current: ${current})`,
    matchOnDescription: true
  });
  if (!pick) return;

  let hex = pick.hex;

  if (!hex) {
    const input = await vscode.window.showInputBox({
      prompt: `Enter ${kind} color hex (#RRGGBB or #RRGGBBAA)`,
      value: current,
      validateInput: (val) => (isValidHexColor(val) ? undefined : "Invalid hex format.")
    });
    if (!input) return;
    hex = input;
  }

  if (kind === "error") {
    await setErrorColorHex(hex);
    vscode.window.showInformationMessage(`bolji_pogled: errorColor = ${hex.toUpperCase()}`);
  } else {
    await setWarningColorHex(hex);
    vscode.window.showInformationMessage(`bolji_pogled: warningColor = ${hex.toUpperCase()}`);
  }
}

/* compatibility for src/no_lines.ts */
export { errorColor, warningColor } from "./test/colors";
