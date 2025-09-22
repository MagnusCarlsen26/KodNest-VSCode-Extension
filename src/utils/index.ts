import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getTemplatesRootPath(extensionUri: vscode.Uri): string {
  // Prefer compiled templates in out/ui/templates when available (packaged VSIX)
  const outTemplates = path.join(extensionUri.fsPath, 'out', 'ui', 'templates');
  if (fs.existsSync(outTemplates)) {
    return outTemplates;
  }

  // Fallback to source templates during development
  return path.join(extensionUri.fsPath, 'src', 'ui', 'templates');
}


