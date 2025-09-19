import * as vscode from 'vscode';
import { ProblemProvider, Problem } from './problemProvider';
import { KodnestCodeLensProvider } from './codeLensProvider';
import { ProblemDescriptionPanel, ProblemMeta } from './descriptionPanel';

export function activate(context: vscode.ExtensionContext) {
    const problemProvider = new ProblemProvider();
    vscode.window.registerTreeDataProvider('kodnestProblems', problemProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand('kodnest.refreshProblems', () => {
            problemProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('kodnest.openProblem', (problem: any) => {
            // Normalize incoming object to ProblemMeta shape
            const meta: ProblemMeta = {
                id: problem.id || (problem && problem.fileId) || 'unknown-id',
                title: problem.title || (problem && problem.label) || 'Untitled Problem',
                difficulty: problem.difficulty || 'Unknown',
                // In dev we use placeholder text. Replace with real content from your API.
                content_markdown: problem.content_markdown || `# ${problem.title || 'Untitled'}\n\n(Description not loaded during dev)`,
                samples: problem.samples || []
            };

            // Open only the description webview (user will click "Open in Editor" to get the code file)
            ProblemDescriptionPanel.createOrShow(context.extensionUri, meta);
        })
    );

    const codeLensProvider = new KodnestCodeLensProvider();
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider({ scheme: 'file', language: 'javascript' }, codeLensProvider)
    );
  
    context.subscriptions.push(
      vscode.commands.registerCommand('kodnest.showDescription', async (docOrProblem: any) => {
        // docOrProblem might be a TextDocument (from CodeLens) or our Problem object (from tree)
        // normalize into ProblemMeta
        let problem: ProblemMeta | undefined;

        if (docOrProblem && docOrProblem.id && docOrProblem.title) {
          // it's already the problem meta
          problem = docOrProblem as ProblemMeta;
        } else {
          // fallback: try to infer from current editor
          const editor = vscode.window.activeTextEditor;
          if (!editor) {
            vscode.window.showErrorMessage('No problem context found to show description for.');
            return;
          }
          // attempt to parse a header comment like: // Two Sum (KN-001)
          const firstLine = editor.document.lineAt(0).text;
          const match = firstLine.match(/\/\/\s*(.+)\s*\(([^)]+)\)/);
          if (match) {
            problem = { id: match[2], title: match[1], content_markdown: `# ${match[1]}\n\n(Description not loaded during dev)` };
          } else {
            problem = { id: 'unknown', title: editor.document.fileName, content_markdown: '(Description not available)' };
          }
        }

        ProblemDescriptionPanel.createOrShow(context.extensionUri, problem);
      })
    );

    // Make sure kodnest.run can accept messages from webview
    context.subscriptions.push(
      vscode.commands.registerCommand('kodnest.run', async (payload: any) => {
        // payload might be { problem, sampleIndex } from webview or a TextDocument
        if (payload && payload.problem) {
          const sample = (payload.problem.samples && payload.problem.samples[payload.sampleIndex]) || null;
          vscode.window.showInformationMessage(`Run sample ${payload.sampleIndex + 1} for ${payload.problem.id}`);
          // here call your run harness passing sample.input as input
          return;
        }

        // fallback: if a TextDocument was passed (CodeLens), reuse existing run code
        const editor = vscode.window.activeTextEditor;
        if (!editor) { vscode.window.showErrorMessage('Open a problem file to run.'); return; }
        vscode.window.showInformationMessage(`Running ${editor.document.fileName} (no sample).`);
      })
    );
  
    context.subscriptions.push(
      vscode.commands.registerCommand('kodnest.submit', (doc: vscode.TextDocument) => {
        vscode.window.showInformationMessage(`Submitting ${doc.fileName}...`);
      })
    );

  // NEW: command that *creates* the editor stub from a ProblemMeta
  context.subscriptions.push(
    vscode.commands.registerCommand('kodnest.createEditor', async (problem: ProblemMeta) => {
      if (!problem) {
        vscode.window.showErrorMessage('No problem data provided to create editor.');
        return;
      }

      // Build file content (customize template for languages as you want)
      const docContent = `// ${problem.title} (${problem.difficulty || 'Unknown'})
// Problem ID: ${problem.id}
// Write your solution here

function solution() {
  // TODO: implement
}

`;

      // Create an untitled document with the content
      const untitled = vscode.Uri.parse(`untitled:${problem.id}.js`);
      try {
        const doc = await vscode.workspace.openTextDocument(untitled);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(untitled, new vscode.Position(0, 0), docContent);
        await vscode.workspace.applyEdit(edit);
        await vscode.window.showTextDocument(doc);
      } catch (err) {
        // Fallback: create a new file in workspace (if workspace open)
        try {
          const newUri = vscode.Uri.joinPath(context.extensionUri, `${problem.id}.js`);
          await vscode.workspace.fs.writeFile(newUri, Buffer.from(docContent, 'utf8'));
          const doc2 = await vscode.workspace.openTextDocument(newUri);
          await vscode.window.showTextDocument(doc2);
        } catch (err2) {
          vscode.window.showErrorMessage('Failed to create editor for problem: ' + String(err));
        }
      }
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
