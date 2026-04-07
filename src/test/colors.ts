// Color utilities for conversion, validation and settings management

import * as vscode from "vscode";

// Configuration section for accessibility settings
const CONFIG_SECTION = "a11ySettings";

// Configuration key for error color
const ERROR_KEY = "errorColor";

// Configuration key for warning color 
const WARNING_KEY = "warningColor";

// Default error color in hex format (pinkish) 
export const DEFAULT_ERROR_HEX = "#D81B60";

// Default warning color in hex format (orange-brown) 
export const DEFAULT_WARNING_HEX = "#B26A00";

// Current error color in vscode.Color format 
export let errorColor: vscode.Color = hexToVscodeColor(DEFAULT_ERROR_HEX);

// Current warning color in vscode.Color format 
export let warningColor: vscode.Color = hexToVscodeColor(DEFAULT_WARNING_HEX);

// Sync colors from workspace configuration
export function loadColorsFromConfig(): void {
  const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const errHex = cfg.get<string>(ERROR_KEY, DEFAULT_ERROR_HEX);
  const warnHex = cfg.get<string>(WARNING_KEY, DEFAULT_WARNING_HEX);

  errorColor = hexToVscodeColor(errHex);
  warningColor = hexToVscodeColor(warnHex);
}

// Update error color in config
export async function setErrorColorHex(
  hex: string,
  target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
): Promise<void> {
  const normalized = normalizeHex(hex);
  await vscode.workspace.getConfiguration(CONFIG_SECTION).update(ERROR_KEY, normalized, target);
  errorColor = hexToVscodeColor(normalized);
}

// Update warning color in config
export async function setWarningColorHex(
  hex: string,
  target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
): Promise<void> {
  const normalized = normalizeHex(hex);
  await vscode.workspace.getConfiguration(CONFIG_SECTION).update(WARNING_KEY, normalized, target);
  warningColor = hexToVscodeColor(normalized);
}

// Restore default diagnostic colors
export async function resetDiagnosticColors(
  target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
): Promise<void> {
  await vscode.workspace.getConfiguration(CONFIG_SECTION).update(ERROR_KEY, DEFAULT_ERROR_HEX, target);
  await vscode.workspace.getConfiguration(CONFIG_SECTION).update(WARNING_KEY, DEFAULT_WARNING_HEX, target);
  loadColorsFromConfig();
}

// Convert VS Code color object to hex string
export function vscodeColorToHex(c: vscode.Color, includeAlpha: boolean = false): string {
  // Convert normalized color values (0-1) to 8-bit values (0-255)
  const r = Math.round(clamp01(c.red) * 255);
  const g = Math.round(clamp01(c.green) * 255);
  const b = Math.round(clamp01(c.blue) * 255);
  const a = Math.round(clamp01(c.alpha) * 255);

  // Convert to hex string components
  const rr = r.toString(16).padStart(2, "0").toUpperCase();
  const gg = g.toString(16).padStart(2, "0").toUpperCase();
  const bb = b.toString(16).padStart(2, "0").toUpperCase();
  const aa = a.toString(16).padStart(2, "0").toUpperCase();

  return includeAlpha ? `#${rr}${gg}${bb}${aa}` : `#${rr}${gg}${bb}`;
}

// Check if hex color string is valid
export function isValidHexColor(input: string): boolean {
  const s = input.trim();
  return /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

// Ensure hex starts with # and is valid
function normalizeHex(input: string): string {
  const s = input.trim();
  const withHash = s.startsWith("#") ? s : `#${s}`;
  const upper = withHash.toUpperCase();

  if (!isValidHexColor(upper)) {
    throw new Error(`Invalid hex color: ${input}`);
  }
  return upper;
}

// Create VS Code color from hex string
function hexToVscodeColor(input: string): vscode.Color {
  const hex = normalizeHex(input).slice(1);
  
  // Parse RGB components
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Parse alpha component if present, otherwise use 255 (fully opaque)
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;

  // Create vscode.Color with normalized values (0-1 range)
  return new vscode.Color(r / 255, g / 255, b / 255, a / 255);
}

// Constrain value to 0-1 range
function clamp01(n: number): number {
  if (Number.isNaN(n)) {
    return 0;
  }
  return Math.min(1, Math.max(0, n));
}
