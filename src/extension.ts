import * as vscode from 'vscode';
import { ProblemProvider } from './problemProvider';
import { KodnestCodeLensProvider } from './codeLensProvider';
import { ProblemDescriptionPanel } from './descriptionPanel';
import { ProblemMeta, RunPayload } from './types';
import { COMMAND, registerCommand } from './utils/commands';
import { normalizeToProblemMeta, parseProblemFromActiveEditor, createEditorForProblem } from './utils/problem';

export function activate(context: vscode.ExtensionContext) {
  const problemProvider = new ProblemProvider();
  vscode.window.registerTreeDataProvider('kodnestProblems', problemProvider);

  registerCommand(context, COMMAND.REFRESH_PROBLEMS, () => {
    problemProvider.refresh();
  });

  registerCommand(context, COMMAND.OPEN_PROBLEM, (problemLike: unknown) => {
    const meta = normalizeToProblemMeta(problemLike);
    ProblemDescriptionPanel.createOrShow(context.extensionUri, meta);
  });

  const codeLensProvider = new KodnestCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: 'file', language: 'javascript' }, codeLensProvider)
  );

  registerCommand(context, COMMAND.SHOW_DESCRIPTION, (docOrProblem: unknown) => {
    let problem: ProblemMeta | undefined;
    const asAny = docOrProblem as any;
    if (asAny?.id && asAny?.title) {
      problem = asAny as ProblemMeta;
    } else {
      problem = parseProblemFromActiveEditor();
    }
    if (!problem) {
      vscode.window.showErrorMessage('No problem context found to show description for.');
      return;
    }
    ProblemDescriptionPanel.createOrShow(context.extensionUri, problem);
  });

  registerCommand(context, COMMAND.RUN, async (payload: RunPayload | vscode.TextDocument | undefined) => {
    const maybePayload = payload as RunPayload | undefined;
    if (maybePayload && typeof maybePayload === 'object' && 'problem' in maybePayload && maybePayload.problem) {
      const idx = Number(maybePayload.sampleIndex ?? 0);
      vscode.window.showInformationMessage(`Run sample ${idx + 1} for ${maybePayload.problem.id}`);
      return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('Open a problem file to run.');
      return;
    }
    vscode.window.showInformationMessage(`Running ${editor.document.fileName} (no sample).`);
  });

  registerCommand(context, COMMAND.SUBMIT, (doc: vscode.TextDocument) => {
    vscode.window.showInformationMessage(`Submitting ${doc.fileName}...`);
  });

  registerCommand(context, COMMAND.CREATE_EDITOR, async (problem: ProblemMeta) => {
    if (!problem) {
      vscode.window.showErrorMessage('No problem data provided to create editor.');
      return;
    }
    await createEditorForProblem(context, problem);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
