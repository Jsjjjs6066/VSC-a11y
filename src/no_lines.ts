import * as vscode from 'vscode';
import { errorColor, warningColor } from './colors';

export function activate(context: vscode.ExtensionContext) {
    let errors = new Map<vscode.TextEditor, vscode.TextEditorDecorationType | undefined>();
    let warnings = new Map<vscode.TextEditor, vscode.TextEditorDecorationType | undefined>();

    // let errorDecorationType: vscode.TextEditorDecorationType | undefined;
    // let warningDecorationType: vscode.TextEditorDecorationType | undefined;
    
    function updateDecorations() {
        const transparency = 0.2;
        const transparencyborder = 0.6;
        let error1 = errorColor;
        error1 = new vscode.Color(error1.red * 255, error1.green * 255, error1.blue * 255, transparencyborder);
        let error2 = errorColor;
        error2 = new vscode.Color(error2.red * 255, error2.green * 255, error2.blue * 255, transparency);
        let warning1 = warningColor;
        let warning2 = warningColor;
        warning1 = new vscode.Color(warning1.red * 255, warning1.green * 255, warning1.blue * 255, transparencyborder);
        warning2 = new vscode.Color(warning2.red * 255, warning2.green * 255, warning2.blue * 255, transparency);

        vscode.window.visibleTextEditors.forEach((value: vscode.TextEditor, index: number, array: readonly vscode.TextEditor[]) => {
            if (errors.get(value)) {
                errors.get(value)?.dispose();
            }
            if (warnings.get(value)) {
                warnings.get(value)?.dispose();
            }

            errors.set(value, vscode.window.createTextEditorDecorationType({
                border: `0.5px solid`,
                borderColor: `rgba(${error1.red}, ${error1.green}, ${error1.blue}, ${error1.alpha})`,
                backgroundColor: `rgba(${error2.red}, ${error2.green}, ${error2.blue}, ${error2.alpha})`,
                borderRadius: '5px',
                overviewRulerLane: vscode.OverviewRulerLane.Full,
                fontWeight: 'bold',
            }));

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

            let diagnostics = vscode.languages.getDiagnostics(activeEditor.document.uri);
            
            let errorRanges: vscode.Range[] = [];
            let warningRanges: vscode.Range[] = [];

            diagnostics.forEach(diagnostic => {
                if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                    errorRanges.push(diagnostic.range);
                } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
                    warningRanges.push(diagnostic.range);
                }
            });

            activeEditor.setDecorations(vscode.window.createTextEditorDecorationType({}), errorRanges);
            activeEditor.setDecorations(vscode.window.createTextEditorDecorationType({}), warningRanges);

            activeEditor.setDecorations(errors.get(value)!, errorRanges);
            activeEditor.setDecorations(warnings.get(value)!, warningRanges);
        });
    }

    vscode.window.onDidChangeVisibleTextEditors(() => updateDecorations());
    // vscode.window.onDidChangeActiveTextEditor(() => updateDecorations());
    vscode.languages.onDidChangeDiagnostics(() => updateDecorations());
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration("a11ySettings.errorColor") ||
                e.affectsConfiguration("a11ySettings.warningColor")
            ) {
                updateDecorations();
            }
        })
    );
    updateDecorations();
}