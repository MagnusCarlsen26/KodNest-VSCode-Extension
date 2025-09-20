import * as vscode from 'vscode';
import { ProblemProvider } from './problemProvider';
import { KodnestCodeLensProvider } from './codeLensProvider';
import { ProblemDescriptionPanel } from './descriptionPanel';
import { ProblemMeta, RunPayload } from './types';
import { COMMAND, registerCommand } from './utils/commands';
import { normalizeToProblemMeta, parseProblemFromActiveEditor, createEditorForProblem } from './utils/problem';
import { ProblemsWebviewProvider } from './problemsWebview';

export async function activate(context: vscode.ExtensionContext) {
  const problemProvider = new ProblemProvider();

  // Register sidebar Webview View instead of TreeDataProvider
  const webviewProvider = new ProblemsWebviewProvider(context.extensionUri, problemProvider);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ProblemsWebviewProvider.viewId, webviewProvider)
  );

  // Load problems, then refresh the webview with data
  await problemProvider.loadProblems(context.extensionPath);
  webviewProvider.refresh();

  // Refresh webview when underlying problems change
  context.subscriptions.push(
    problemProvider.onDidChangeTreeData(() => webviewProvider.refresh())
  );

  registerCommand(context, COMMAND.REFRESH_PROBLEMS, () => {
    problemProvider.refresh();
    webviewProvider.refresh();
  });

  registerCommand(context, COMMAND.OPEN_PROBLEM, (problemLike: unknown) => {
    let meta: ProblemMeta;

    // If it's just a string (ID), look up the full problem data
    if (typeof problemLike === 'string') {
      const problem = problemProvider.findProblemById(problemLike);
      if (problem) {
        meta = {
          id: problem.id,
          title: problem.title,
          difficulty: problem.difficulty,
          content_markdown: problem.content_markdown || `# ${problem.title}\n\n(No description available)`,
          samples: problem.samples || [],
          sectionId: problem.sectionId,
          status: problem.status,
          topic: problem.topic,
          moduleName: problem.moduleName,
          moduleDescription: problem.moduleDescription,
          moduleDifficulty: problem.moduleDifficulty,
          moduleCategoryTitle: problem.moduleCategoryTitle
        };
      } else {
        // Fallback to creating a basic meta from the ID
        meta = normalizeToProblemMeta({ id: problemLike });
      }
    } else {
      // Use the existing normalization logic for other types
      meta = normalizeToProblemMeta(problemLike);
    }

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
