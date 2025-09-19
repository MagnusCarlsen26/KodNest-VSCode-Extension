import * as vscode from 'vscode';

export class KodnestCodeLensProvider implements vscode.CodeLensProvider {
  onDidChangeCodeLenses?: vscode.Event<void> | undefined;

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const fileStartRange = new vscode.Range(0, 0, 0, 0);

    return [
      new vscode.CodeLens(fileStartRange, {
        title: '▶ Run',
        command: 'kodnest.run',
        arguments: [document]
      }),
      new vscode.CodeLens(fileStartRange, {
        title: '⬆ Submit',
        command: 'kodnest.submit',
        arguments: [document]
      }),
      new vscode.CodeLens(fileStartRange, {
        title: 'ℹ Show Description',
        command: 'kodnest.showDescription',
        arguments: [document]
      })
    ];
  }
}
