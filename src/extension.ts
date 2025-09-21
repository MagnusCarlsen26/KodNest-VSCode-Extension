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
          moduleCategoryTitle: problem.moduleCategoryTitle,
          languages: problem.languages // Include the languages property
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
    if (payload && typeof payload === 'object' && 'problem' in (payload as any) && (payload as any).problem) {
      const rp = payload as RunPayload;
      const problem = rp.problem as ProblemMeta;
      const sampleIndex = Number(rp.sampleIndex ?? 0);
      const title = problem?.title ?? problem?.id ?? 'unknown problem';
      vscode.window.showInformationMessage(`Run clicked for "${title}" (sample ${sampleIndex})`);
      return;
    }

    // If the payload is a TextDocument
    if (payload && typeof payload === 'object' && 'uri' in (payload as any) && (payload as any).getText) {
      const doc = payload as vscode.TextDocument;
      const pm = tryParseProblemFromDoc(doc);
      const name = pm?.title ?? doc.fileName;
      vscode.window.showInformationMessage(`Run clicked for ${name}`);
      return;
    }

    // Fallback to active editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('Open a problem file to run.');
      return;
    }
    const activeProblem = parseProblemFromActiveEditor();
    const activeName = activeProblem ? activeProblem.title : editor.document.fileName;
    vscode.window.showInformationMessage(`Run clicked for ${activeName}`);
  });

  // SUBMIT command - shows notifications, supports being called with a TextDocument or fallback to active editor
  registerCommand(context, COMMAND.SUBMIT, async (docOrUri?: vscode.TextDocument | vscode.Uri | string) => {
    let doc: vscode.TextDocument | undefined;

    // If a TextDocument was passed directly
    if (docOrUri && typeof (docOrUri as any).getText === 'function') {
      doc = docOrUri as vscode.TextDocument;
    } else if (docOrUri && typeof docOrUri === 'string') {
      // maybe a URI string
      try {
        const uri = vscode.Uri.parse(docOrUri);
        doc = await vscode.workspace.openTextDocument(uri);
      } catch {
        // ignore parse/open error and fall through to active editor
      }
    } else if (docOrUri && (docOrUri as vscode.Uri).scheme) {
      // passed a Uri
      try {
        doc = await vscode.workspace.openTextDocument(docOrUri as vscode.Uri);
      } catch {
        // ignore and fallback
      }
    }

    if (!doc) {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor to submit.');
        return;
      }
      doc = editor.document;
    }

    // Try to extract problem meta from the document (if you store metadata in comments)
    const pm = tryParseProblemFromDoc(doc);
    const name = pm?.title ?? doc.fileName;
    vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Submitting ${name}`, cancellable: false },
      async (progress) => {
        progress.report({ message: 'Preparing...' });
        // small delay so progress UI is visible; remove in real submission
        await new Promise((r) => setTimeout(r, 250));
        // show notification (placeholder)
        vscode.window.showInformationMessage(`Submit clicked for ${name}`);
        progress.report({ message: 'Done' });
      }
    );
  });

  // CREATE_EDITOR command - create an editor for the provided ProblemMeta
  registerCommand(context, COMMAND.CREATE_EDITOR, async (problem: ProblemMeta) => {
    if (!problem) {
      vscode.window.showErrorMessage('No problem data provided to create editor.');
      return;
    }
    try {
      await createEditorForProblem(context, problem);
      vscode.window.showInformationMessage(`Opened editor for "${problem.title ?? problem.id}".`);
    } catch (err) {
      vscode.window.showErrorMessage('Failed to create editor: ' + String(err));
    }
  });
}

// Try to parse ProblemMeta from a document using your helper. If it fails, return undefined.
function tryParseProblemFromDoc(doc: vscode.TextDocument | undefined): ProblemMeta | undefined {
  if (!doc) return undefined;
  try {
    // If you have a helper that reads problem meta from top comments, use it
    // Your existing parseProblemFromActiveEditor uses active editor; we replicate behavior by switching editors
    // temporarily: open the document in the editor then call parse helper or implement a doc-based parse helper.
    // For simplicity here, attempt to parse using active editor if it's the same doc
    const active = vscode.window.activeTextEditor;
    if (active && active.document === doc) {
      return parseProblemFromActiveEditor();
    }

    // Otherwise try a naive approach: look for a line `// problem-id: <id>` on the first 5 lines
    for (let i = 0; i < Math.min(5, doc.lineCount); i++) {
      const text = doc.lineAt(i).text;
      const m = text.match(/problem-id:\s*(\S+)/i);
      if (m) {
        return normalizeToProblemMeta({ id: m[1], title: m[1] });
      }
    }
  } catch {
    // ignore parse errors
  }
  return undefined;
}

export function deactivate() {}