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
  const moduleId = asAny?.moduleId;
  const status = asAny?.status;
  const topic = asAny?.topic;
  const moduleName = asAny?.moduleName;
  const moduleDescription = asAny?.moduleDescription;
  const moduleDifficulty = asAny?.moduleDifficulty;
  const moduleCategoryTitle = asAny?.moduleCategoryTitle;
  return { id, title, difficulty, content_markdown, samples, sectionId, moduleId, status, topic, moduleName, moduleDescription, moduleDifficulty, moduleCategoryTitle, languages: asAny?.languages };
}

// Helper to get file extension from language name
function getFileExtension(languageName: string): string {
  switch (languageName.toLowerCase()) {
    case 'java (openjdk 13.0.1)': return '.java';
    case 'python': return '.py';
    case 'javascript': return '.js';
    case 'typescript': return '.ts';
    default: return '.txt';
  }
}

// Helper to sanitize title for filename
function sanitizeFilename(title: string): string {
  return title.replace(/[^a-z0-9_\-]/gi, '_');
}

export function parseProblemFromActiveEditor(): ProblemMeta | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return undefined; }
  const doc = editor.document;
  const maxLinesToScan = Math.min(15, doc.lineCount);
  const meta: any = {};
  for (let i = 0; i < maxLinesToScan; i++) {
    const text = doc.lineAt(i).text.trim();
    // Pattern: // Title (id)
    const titleMatch = text.match(/^\/\/\s*(.+)\s*\(([^)]+)\)\s*$/);
    if (titleMatch) {
      meta.title = meta.title || titleMatch[1];
      meta.id = meta.id || titleMatch[2];
      continue;
    }
    // Pattern: // key: value
    const kv = text.match(/^\/\/\s*([a-zA-Z0-9_]+)\s*:\s*(.+)\s*$/);
    if (kv) {
      const key = kv[1];
      const value = kv[2];
      if (['sectionId', 'moduleId', 'id', 'title'].includes(key)) {
        meta[key] = value;
      } else if (key === 'languageId') {
        meta.languages = meta.languages || [{}];
        meta.languages[0].id = value;
      } else if (key === 'languageName') {
        meta.languages = meta.languages || [{}];
        meta.languages[0].name = value;
      }
    }
  }
  if (meta.id && meta.title) {
    return normalizeToProblemMeta(meta);
  }
  // fallback to old single-line format only
  const firstLine = doc.lineAt(0).text;
  const match = firstLine.match(/\/\/\s*(.+)\s*\(([^)]+)\)/);
  if (match) {
    return { id: match[2], title: match[1], difficulty: 'Unknown', content_markdown: `# ${match[1]}\n\n(Description not loaded during dev)` };
  }
  return { id: 'unknown', title: doc.fileName, difficulty: 'Unknown', content_markdown: '(Description not available)' };
}

export async function createEditorForProblem(
  context: vscode.ExtensionContext,
  problem: ProblemMeta,
): Promise<void> {

  //   "title", 
  //   "difficulty", 
  //   "content_markdown", 
  //   "samples", 
  //   "sectionId", 
  //   "status", 
  //   "topic", 
  //   "moduleName", 
  //   "moduleDescription", 
  //   "moduleDifficulty", 
  //   "moduleCategoryTitle" ]

  try {
    const boilerplate = problem.languages?.[0]?.boilerplate;
    const language = problem.languages?.[0]?.name;

    if (!boilerplate) {
      vscode.window.showErrorMessage(`No boilerplate code available for problem: ${problem.title}`);
      return;
    }

    const fileExtension = getFileExtension(language || 'unknown');
    const sanitizedTitle = sanitizeFilename(problem.title);
    const fileName = `${sanitizedTitle}${fileExtension}`;

    // Determine the path within the extension's workspace storage
    let baseStorageUri: vscode.Uri | undefined = context.storageUri;
    let storageType = 'workspace';

    if (!baseStorageUri) {
      baseStorageUri = context.globalStorageUri;
      storageType = 'global';
      if (!baseStorageUri) {
        vscode.window.showErrorMessage('Neither workspace nor global storage is available.');
        return;
      }
      vscode.window.showInformationMessage(`Workspace storage not available. Using global storage at: ${baseStorageUri.fsPath}`);
    }
    
    const solutionsDir = vscode.Uri.joinPath(baseStorageUri, 'solutions');
    const fileUri = vscode.Uri.joinPath(solutionsDir, fileName);

    // Ensure the directory exists
    await vscode.workspace.fs.createDirectory(solutionsDir);

    // Check if the file already exists
    try {
      await vscode.workspace.fs.stat(fileUri);
      // File exists, open it
      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.One });
      vscode.window.showInformationMessage(`Opened existing file: ${fileName}`);
    } catch (e) {
      // File does not exist, create it with boilerplate
      const headerLines = [
        `// ${problem.title} (${problem.id})`,
        problem.sectionId ? `// sectionId: ${problem.sectionId}` : undefined,
        (problem as any).moduleId ? `// moduleId: ${(problem as any).moduleId}` : undefined,
        language ? `// languageName: ${language}` : undefined,
        problem.languages?.[0]?.id ? `// languageId: ${problem.languages?.[0]?.id}` : undefined,
        ''
      ].filter(Boolean).join('\n');
      const content = `${headerLines}\n${boilerplate}`;
      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf8'));
      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.One });
      vscode.window.showInformationMessage(`Created new file: ${fileName}`);
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to create editor for problem: ${err}`);
  }
}
