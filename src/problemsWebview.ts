import * as vscode from 'vscode';
import { ProblemProvider } from './problemProvider';
import { Problem, Module } from './types';
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
    const modules = this.problemProvider.getChildren() as Module[];
    for (const module of modules) {
      const problem = module.problems.find(p => p.id === id);
      if (problem) {
        return problem;
      }
    }
    return undefined;
  }

  private render(query: string = ''): void {
    if (!this.view) {
      vscode.window.showInformationMessage('Problems Webview: View not yet initialized.');
      return;
    }
    vscode.window.showInformationMessage('Rendering problems...');
    const nonce = getNonce();
    const allModules = this.problemProvider.getChildren() as Module[];
    vscode.window.showInformationMessage(`[Kodnest] ${allModules.length} modules found`);

    // Filter modules and problems based on query
    let filteredModules = allModules;
    if (query) {
      filteredModules = allModules.map(module => {
        const filteredProblems = module.problems.filter(p =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.id.toLowerCase().includes(query.toLowerCase()) ||
          (p.topic ? p.topic.toLowerCase().includes(query.toLowerCase()) : false)
        );
        return { ...module, problems: filteredProblems };
      }).filter(module => module.problems.length > 0);
    }

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
    .module { margin-bottom: 16px; }
    .module-header {
      padding: 8px 12px;
      padding-left: 24px;
      background: var(--vscode-editorGroupHeader-tabsBackground);
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid var(--vscode-editorGroup-border);
      position: relative;
      user-select: none;
    }
    .module-arrow {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 10px;
      color: var(--vscode-foreground);
      opacity: 0.7;
      font-family: monospace;
    }
    .module-title {
      font-weight: 600;
      font-size: 1.1em;
      margin-left: 16px;
    }
    .module-meta {
      font-size: 0.85em;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
      margin-left: 16px;
    }
    .problems-list {
      margin-top: 8px;
      padding-left: 16px;
    }
    .item {
      padding: 8px;
      border-radius: 6px;
      margin-bottom: 6px;
      border: 1px solid var(--vscode-editorGroup-border);
      background: var(--vscode-editor-background);
      cursor: pointer;
    }
    .title { font-weight: 600; }
    .meta {
      font-size: 0.85em;
      color: var(--vscode-descriptionForeground);
      margin-top: 2px;
    }
    .difficulty-Easy { color: #6bb341; }
    .difficulty-Medium { color: #d49a00; }
    .difficulty-Hard { color: #e44258; }
    .empty { color: var(--vscode-descriptionForeground); text-align: center; padding: 12px; }
    .collapsed .problems-list { display: none; }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="controls">
        <input id="search" type="search" placeholder="Search by title, id or topic" value="${escapeHtml(query)}" />
        <button id="refresh">Refresh</button>
      </div>
      <div id="list">
        ${filteredModules.map(module => `
          <div class="module collapsed" data-module-id="${escapeHtml(module.id)}">
            <div class="module-header" data-module-id="${escapeHtml(module.id)}">
              <span class="module-arrow">▶</span>
              <div class="module-title">${escapeHtml(module.name)}</div>
              <div class="module-meta">
                ${escapeHtml(module.difficulty)} |
                ${module.problems.filter(p => p.status === 'solved').length}/${module.problems.length} solved
                ${module.categoryTitle ? ` | ${escapeHtml(module.categoryTitle)}` : ''}
              </div>
            </div>
            <div class="problems-list">
              ${module.problems.map(p => `
                <div class="item" data-id="${escapeHtml(p.id)}">
                  <div class="title">${escapeHtml(p.title)}</div>
                  <div class="meta">
                    <span class="difficulty-${p.difficulty}">${escapeHtml(p.difficulty)}</span>
                    ${p.status ? ` | Status: ${escapeHtml(p.status)}` : ''}
                    ${p.topic ? ` | Topic: ${escapeHtml(p.topic)}` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        ${filteredModules.length === 0 ? `<div class="empty">No problems found.</div>` : ''}
      </div>
    </div>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();

      function toggleModule(moduleId) {
        const moduleElement = document.querySelector(\`[data-module-id="\${moduleId}"]\`);
        if (moduleElement) {
          const isCollapsed = moduleElement.classList.toggle('collapsed');
          // Update the arrow indicator
          const arrow = moduleElement.querySelector('.module-arrow');
          if (arrow) {
            arrow.textContent = isCollapsed ? '▶' : '▼';
          }
          console.log('Toggled module:', moduleId, 'collapsed:', isCollapsed);
        } else {
          console.log('Module element not found for id:', moduleId);
        }
      }

      document.getElementById('refresh').addEventListener('click', () => {
        vscode.postMessage({ command: 'refresh' });
      });

      document.getElementById('search').addEventListener('input', (e) => {
        vscode.postMessage({ command: 'filter', query: e.target.value || '' });
      });

      document.querySelectorAll('.item').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = el.getAttribute('data-id');
          vscode.postMessage({ command: 'openProblem', id });
        });
      });

      // Add event listeners for module headers
      document.addEventListener('click', (e) => {
        const header = e.target.closest('.module-header');
        if (header) {
          e.stopPropagation();
          const moduleId = header.getAttribute('data-module-id');
          if (moduleId) {
            toggleModule(moduleId);
          }
        }
      });
    </script>
  </body>
  </html>`;
  }
}