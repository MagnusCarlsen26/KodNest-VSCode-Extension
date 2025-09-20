import * as vscode from 'vscode';
import { ProblemMeta } from '../types';

export function normalizeToProblemMeta(input: unknown): ProblemMeta {
  const asAny = input as any;
  const id = asAny?.id ?? asAny?.fileId ?? 'unknown-id';
  const title = asAny?.title ?? asAny?.label ?? 'Untitled Problem';
  const difficulty = asAny?.difficulty ?? 'Unknown';
  const content_markdown = asAny?.content_markdown ?? `# ${title}\n\n(Description not loaded during dev)`;
  const samples = Array.isArray(asAny?.samples) ? asAny.samples : [];
  const sectionId = asAny?.sectionId;
  const status = asAny?.status;
  const topic = asAny?.topic;
  const moduleName = asAny?.moduleName;
  const moduleDescription = asAny?.moduleDescription;
  const moduleDifficulty = asAny?.moduleDifficulty;
  const moduleCategoryTitle = asAny?.moduleCategoryTitle;
  return { id, title, difficulty, content_markdown, samples, sectionId, status, topic, moduleName, moduleDescription, moduleDifficulty, moduleCategoryTitle };
}

export function parseProblemFromActiveEditor(): ProblemMeta | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return undefined; }
  const firstLine = editor.document.lineAt(0).text;
  const match = firstLine.match(/\/\/\s*(.+)\s*\(([^)]+)\)/);
  if (match) {
    return { id: match[2], title: match[1], difficulty: 'Unknown', content_markdown: `# ${match[1]}\n\n(Description not loaded during dev)` };
  }
  return { id: 'unknown', title: editor.document.fileName, difficulty: 'Unknown', content_markdown: '(Description not available)' };
}

export async function createEditorForProblem(context: vscode.ExtensionContext, problem: ProblemMeta): Promise<void> {
  const docContent = `// ${problem.title} (${problem.difficulty || 'Unknown'})\n// Problem ID: ${problem.id}\n// Write your solution here\n\nfunction solution() {\n  // TODO: implement\n}\n\n`;
  const untitled = vscode.Uri.parse(`untitled:${problem.id}.js`);
  try {
    const doc = await vscode.workspace.openTextDocument(untitled);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(untitled, new vscode.Position(0, 0), docContent);
    await vscode.workspace.applyEdit(edit);
    await vscode.window.showTextDocument(doc);
    return;
  } catch (err) {
    // fall through to workspace file creation
  }
  try {
    const newUri = vscode.Uri.joinPath(context.extensionUri, `${problem.id}.js`);
    await vscode.workspace.fs.writeFile(newUri, Buffer.from(docContent, 'utf8'));
    const doc2 = await vscode.workspace.openTextDocument(newUri);
    await vscode.window.showTextDocument(doc2);
  } catch {
    vscode.window.showErrorMessage('Failed to create editor for problem.');
  }
}


