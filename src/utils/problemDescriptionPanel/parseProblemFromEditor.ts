import * as vscode from 'vscode';
import { ProblemMeta } from '../../types';
import { normalizeToProblemMeta } from './normalizeToProblemMeta';


export function parseProblemFromActiveEditor(

): ProblemMeta | undefined {

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
  