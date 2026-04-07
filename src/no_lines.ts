import * as vscode from 'vscode';
import { errorColor, warningColor } from './colors';

// Core activation for error/warning highlighting
export function activate(context: vscode.ExtensionContext) {
    // Maps to track active decorations per editor
    let errors = new Map<vscode.TextEditor, vscode.TextEditorDecorationType | undefined>();
    let warnings = new Map<vscode.TextEditor, vscode.TextEditorDecorationType | undefined>();

    // Update editor decorations for errors and warnings
    function updateDecorations() {
        // Transparency levels for decoration overlay
        const transparency = 0.2;
        const transparencyborder = 0.6;
        
        // Calculate error highlight colors
        let error1 = errorColor;
        error1 = new vscode.Color(error1.red * 255, error1.green * 255, error1.blue * 255, transparencyborder);
        let error2 = errorColor;
        error2 = new vscode.Color(error2.red * 255, error2.green * 255, error2.blue * 255, transparency);
        
        // Calculate warning highlight colors
        let warning1 = warningColor;
        let warning2 = warningColor;
        warning1 = new vscode.Color(warning1.red * 255, warning1.green * 255, warning1.blue * 255, transparencyborder);
        warning2 = new vscode.Color(warning2.red * 255, warning2.green * 255, warning2.blue * 255, transparency);

        // Iterate through all visible editors to apply decorations
        vscode.window.visibleTextEditors.forEach((value: vscode.TextEditor, index: number, array: readonly vscode.TextEditor[]) => {
            // Clear existing decorations before re-creating
            if (errors.get(value)) {
                errors.get(value)?.dispose();
            }
            if (warnings.get(value)) {
                warnings.get(value)?.dispose();
            }

            // Define visual style for error highlights
            errors.set(value, vscode.window.createTextEditorDecorationType({
                border: `0.5px solid`,
                borderColor: `rgba(${error1.red}, ${error1.green}, ${error1.blue}, ${error1.alpha})`,
                backgroundColor: `rgba(${error2.red}, ${error2.green}, ${error2.blue}, ${error2.alpha})`,
                borderRadius: '5px',
                overviewRulerLane: vscode.OverviewRulerLane.Full,
                fontWeight: 'bold',
            }));

            // Define visual style for warning highlights
            warnings.set(value, vscode.window.createTextEditorDecorationType({
                border: `0.5px solid rgba(255, 255, 0, ${transparencyborder})`,
                borderColor: `rgba(${warning1.red}, ${warning1.green}, ${warning1.blue}, ${warning1.alpha})`,
                backgroundColor: `rgba(${warning2.red}, ${warning2.green}, ${warning2.blue}, ${warning2.alpha})`,
                borderRadius: '5px',
                overviewRulerLane: vscode.OverviewRulerLane.Full,
                textDecoration: 'none',
                fontWeight: 'bold',
            }));

            let activeEditor = value;
            if (!activeEditor) {
                return;
            }

            // Get all diagnostics for the current document
            let diagnostics = vscode.languages.getDiagnostics(activeEditor.document.uri);
            
            // Storage for error and warning ranges
            let errorRanges: vscode.Range[] = [];
            let warningRanges: vscode.Range[] = [];

            // Categorize diagnostics by severity
            diagnostics.forEach(diagnostic => {
                if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                    errorRanges.push(diagnostic.range);
                } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
                    warningRanges.push(diagnostic.range);
                }
            });

            // Clear old decorations
            activeEditor.setDecorations(vscode.window.createTextEditorDecorationType({}), errorRanges);
            activeEditor.setDecorations(vscode.window.createTextEditorDecorationType({}), warningRanges);

            // Apply new stylized decorations
            activeEditor.setDecorations(errors.get(value)!, errorRanges);
            activeEditor.setDecorations(warnings.get(value)!, warningRanges);
        });
    }

    // Listen for visibility and diagnostic changes in the editor
    vscode.window.onDidChangeVisibleTextEditors(() => updateDecorations());
    vscode.languages.onDidChangeDiagnostics(() => updateDecorations());
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            // Re-apply if a11y color settings are modified
            if (
                e.affectsConfiguration("a11ySettings.errorColor") ||
                e.affectsConfiguration("a11ySettings.warningColor")
            ) {
                updateDecorations();
            }
        })
    );
    // Initial application of decorations
    updateDecorations();
}