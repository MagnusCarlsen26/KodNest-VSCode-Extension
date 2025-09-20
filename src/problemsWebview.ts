import * as vscode from 'vscode';
import { ProblemProvider } from './problemProvider';
import { Problem } from './types';
import { getNonce, escapeHtml } from './utils';

export class ProblemsWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'kodnestProblems';

  private view: vscode.WebviewView | undefined;
  private readonly problemProvider: ProblemProvider;
  private readonly extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri, problemProvider: ProblemProvider) {
    this.extensionUri = extensionUri;
    this.problemProvider = problemProvider;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    this.render();

    webviewView.webview.onDidReceiveMessage((msg) => {
      switch (msg.command) {
        case 'openProblem': {
          const problem: Problem | undefined = this.findProblemById(msg.id);
          if (problem) {
            vscode.commands.executeCommand('kodnest.openProblem', problem);
          }
          return;
        }
        case 'refresh': {
          this.render();
          return;
        }
        case 'filter': {
          this.render(String(msg.query || ''));
          return;
        }
      }
    });
  }

  public refresh(): void {
    this.render();
  }

  private findProblemById(id: string): Problem | undefined {
    const items = this.problemProvider.getChildren();
    return items.find(p => p.id === id);
  }

  private render(query: string = ''): void {
    if (!this.view) {
      vscode.window.showInformationMessage('Problems Webview: View not yet initialized.');
      return;
    }
    vscode.window.showInformationMessage('Rendering problems...');
    const nonce = getNonce();
    const allProblems = this.problemProvider.getChildren();
    vscode.window.showInformationMessage(`[Kodnest] ${allProblems.length} problems found`);
    const problems = query
      ? allProblems.filter(p =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.id.toLowerCase().includes(query.toLowerCase()) ||
          (p.topic ? p.topic.toLowerCase().includes(query.toLowerCase()) : false)
        )
      : allProblems;

    this.view.webview.html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kodnest Problems</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-sideBar-background); }
    .container { padding: 8px; }
    .controls { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
    input[type="search"] { flex:1; padding:6px 8px; border-radius:4px; border:1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); }
    button { padding:6px 10px; border-radius:4px; border:none; background: var(--vscode-button-background); color: var(--vscode-button-foreground); cursor:pointer; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .item { padding:8px; border-radius:6px; margin-bottom:6px; border:1px solid var(--vscode-editorGroup-border); background: var(--vscode-editor-background); cursor: pointer; }
    .title { font-weight: 600; }
    .meta { font-size: 0.85em; color: var(--vscode-descriptionForeground); margin-top: 2px; }
    .difficulty-Easy { color: #6bb341; }
    .difficulty-Medium { color: #d49a00; }
    .difficulty-Hard { color: #e44258; }
    .empty { color: var(--vscode-descriptionForeground); text-align:center; padding: 12px; }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="controls">
        <input id="search" type="search" placeholder="Search by title, id or topic" value="${escapeHtml(query)}" />
        <button id="refresh">Refresh</button>
      </div>
      <div id="list">
        ${problems.map(p => `
          <div class="item" data-id="${escapeHtml(p.id)}">
            <div class="title">${escapeHtml(p.title)}</div>
            <div class="meta">
              <span class="difficulty-${p.difficulty}">${escapeHtml(p.difficulty)}</span>
              ${p.status ? ` | Status: ${escapeHtml(p.status)}` : ''}
              ${p.topic ? ` | Topic: ${escapeHtml(p.topic)}` : ''}
            </div>
          </div>
        `).join('')}
        ${problems.length === 0 ? `<div class="empty">No problems found.</div>` : ''}
      </div>
    </div>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      document.getElementById('refresh').addEventListener('click', () => {
        vscode.postMessage({ command: 'refresh' });
      });
      document.getElementById('search').addEventListener('input', (e) => {
        vscode.postMessage({ command: 'filter', query: e.target.value || '' });
      });
      document.querySelectorAll('.item').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.getAttribute('data-id');
          vscode.postMessage({ command: 'openProblem', id });
        });
      });
    </script>
  </body>
  </html>`;
  }
}


