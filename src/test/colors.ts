import * as vscode from "vscode";

const CONFIG_SECTION = "bolji-pogled";
const ERROR_KEY = "errorColor";
const WARNING_KEY = "warningColor";

export const DEFAULT_ERROR_HEX = "#D81B60";
export const DEFAULT_WARNING_HEX = "#B26A00";

export let errorColor: vscode.Color = hexToVscodeColor(DEFAULT_ERROR_HEX);
export let warningColor: vscode.Color = hexToVscodeColor(DEFAULT_WARNING_HEX);

export function loadColorsFromConfig(): void {
  const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const errHex = cfg.get<string>(ERROR_KEY, DEFAULT_ERROR_HEX);
  const warnHex = cfg.get<string>(WARNING_KEY, DEFAULT_WARNING_HEX);

  errorColor = hexToVscodeColor(errHex);
  warningColor = hexToVscodeColor(warnHex);
}

export async function setErrorColorHex(
  hex: string,
  target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
): Promise<void> {
  const normalized = normalizeHex(hex);
  await vscode.workspace.getConfiguration(CONFIG_SECTION).update(ERROR_KEY, normalized, target);
  errorColor = hexToVscodeColor(normalized);
}

export async function setWarningColorHex(
  hex: string,
  target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
): Promise<void> {
  const normalized = normalizeHex(hex);
  await vscode.workspace.getConfiguration(CONFIG_SECTION).update(WARNING_KEY, normalized, target);
  warningColor = hexToVscodeColor(normalized);
}

export async function resetDiagnosticColors(
  target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
): Promise<void> {
  await vscode.workspace.getConfiguration(CONFIG_SECTION).update(ERROR_KEY, DEFAULT_ERROR_HEX, target);
  await vscode.workspace.getConfiguration(CONFIG_SECTION).update(WARNING_KEY, DEFAULT_WARNING_HEX, target);
  loadColorsFromConfig();
}

export function vscodeColorToHex(c: vscode.Color, includeAlpha: boolean = false): string {
  const r = Math.round(clamp01(c.red) * 255);
  const g = Math.round(clamp01(c.green) * 255);
  const b = Math.round(clamp01(c.blue) * 255);
  const a = Math.round(clamp01(c.alpha) * 255);

  const rr = r.toString(16).padStart(2, "0").toUpperCase();
  const gg = g.toString(16).padStart(2, "0").toUpperCase();
  const bb = b.toString(16).padStart(2, "0").toUpperCase();
  const aa = a.toString(16).padStart(2, "0").toUpperCase();

  return includeAlpha ? `#${rr}${gg}${bb}${aa}` : `#${rr}${gg}${bb}`;
}

export function isValidHexColor(input: string): boolean {
  const s = input.trim();
  return /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

function normalizeHex(input: string): string {
  const s = input.trim();
  const withHash = s.startsWith("#") ? s : `#${s}`;
  const upper = withHash.toUpperCase();

  if (!isValidHexColor(upper)) {
    throw new Error(`Invalid hex color: ${input}`);
  }
  return upper;
}

function hexToVscodeColor(input: string): vscode.Color {
  const hex = normalizeHex(input).slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;

  return new vscode.Color(r / 255, g / 255, b / 255, a / 255);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
