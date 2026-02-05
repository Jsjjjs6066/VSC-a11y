import * as vscode from 'vscode';
import { errorColor, warningColor } from './colors';

// Definiramo stil za Error (npr. debeli crveni pravokutnik)

export function activate(context: vscode.ExtensionContext) {
    const transparency = '0.2';
    const transparencyborder = '0.6';
    const errorDecorationType = vscode.window.createTextEditorDecorationType({
        border: `0.5px solid rgba(255, 0, 0, ${transparencyborder})`, // Debeli crveni rub
        backgroundColor: `rgba(255, 0, 0, ${transparency})`, // Blago crvena pozadina
        // opacity: '0',
        borderRadius: '5px', // Za blago zaobljene rubove pravokutnika
        // overviewRulerColor: 'red',
        overviewRulerLane: vscode.OverviewRulerLane.Full,
        textDecoration: 'none',
        // gutterIconPath: context.asAbsolutePath('assets/error.svg'),// Putanja do ikone za marginu
        // gutterIconSize: 'contain',
        // dark: {
        //     gutterIconPath: context.asAbsolutePath('assets/error_for_dark.svg'), // Putanja do tamne verzije ikone
        // },
    });

    // Definiramo stil za Warning (npr. debeli žuti pravokutnik)
    const warningDecorationType = vscode.window.createTextEditorDecorationType({
        border: `0.5px solid rgba(255, 255, 0, ${transparencyborder})`, // Debeli žuti rub
        backgroundColor: `rgba(255, 255, 0, ${transparency})`, // Blago crvena pozadina
        // opacity: '0',
        borderRadius: '5px', // Za blago zaobljene rubove pravokutnika
        // overviewRulerColor: 'yellow',
        overviewRulerLane: vscode.OverviewRulerLane.Full,
        textDecoration: 'none',
    });
    
    // Funkcija koja ažurira pravokutnike
    function updateDecorations() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }

        const diagnostics = vscode.languages.getDiagnostics(activeEditor.document.uri);
        
        const errorRanges: vscode.Range[] = [];
        const warningRanges: vscode.Range[] = [];

        diagnostics.forEach(diagnostic => {
            if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                errorRanges.push(diagnostic.range);
            } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
                warningRanges.push(diagnostic.range);
            }
        });

        activeEditor.setDecorations(errorDecorationType, errorRanges);
        activeEditor.setDecorations(warningDecorationType, warningRanges);

        // vscode.window.showInformationMessage(`Pronađeno ${errorRanges.length} errora i ${warningRanges.length} warninga.`);
    }

    // Pokreni pri otvaranju ili promjeni dokumenta
    vscode.workspace.onDidChangeTextDocument(() => updateDecorations());
    vscode.window.onDidChangeActiveTextEditor(() => updateDecorations());
    vscode.languages.onDidChangeDiagnostics(() => updateDecorations());
    updateDecorations(); // Pokreni odmah pri aktivaciji
}