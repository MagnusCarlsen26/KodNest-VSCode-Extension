import * as vscode from 'vscode';
// Use dynamic import wrappers to avoid ESM/CJS interop issues under Node16 module resolution
// while keeping the call sites typed.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { marked } = require('marked');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sanitizeHtml: any = require('sanitize-html');
import { ProblemMeta } from './types';
import { escapeHtml, getNonce } from './utils';

export class ProblemDescriptionPanel {
  public static currentPanel: ProblemDescriptionPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _problem: ProblemMeta;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, problem: ProblemMeta) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._problem = problem;

    // Set the initial HTML content
    this._update();

    // Listen for messages from the webview
    this._panel.webview.onDidReceiveMessage(this._handleMessage.bind(this), null, this._disposables);

    // Dispose
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, problem: ProblemMeta): void {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    // If we already have a panel, reveal it
    if (ProblemDescriptionPanel.currentPanel) {
      ProblemDescriptionPanel.currentPanel._panel.reveal(column);
      ProblemDescriptionPanel.currentPanel.updateProblem(problem);
      return;
    }

    // Otherwise create a new panel
    const panel = vscode.window.createWebviewPanel(
      'kodnest.problemDescription',
      `${problem.id} — ${problem.title}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri]
      }
    );

    ProblemDescriptionPanel.currentPanel = new ProblemDescriptionPanel(panel, extensionUri, problem);
  }

  public updateProblem(problem: ProblemMeta): void {
    this._problem = problem;
    this._panel.title = `${problem.id} — ${problem.title}`;
    this._update();
  }

  public dispose(): void {
    ProblemDescriptionPanel.currentPanel = undefined;

    // Clean up
    this._panel.dispose();

    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }

  private _handleMessage(msg: any): void {
    // messages from webview
    switch (msg.command) {
      case 'runSample':
        vscode.commands.executeCommand('kodnest.run', { problem: this._problem, sampleIndex: msg.sampleIndex });
        return;
      case 'openInEditor':
        // call the dedicated command to create the editor stub
        vscode.commands.executeCommand('kodnest.createEditor', this._problem);
        return;
      case 'copyTemplate':
        vscode.env.clipboard.writeText(this._generateTemplate());
        vscode.window.showInformationMessage('Template copied to clipboard.');
        return;
    }
  }

  private _generateTemplate(): string {
    const lang = 'javascript';
    const header = `// ${this._problem.title} (${this._problem.id})\n// Difficulty: ${this._problem.difficulty || 'Unknown'}\n\n`;
    const stub = `function solution() {\n  // TODO\n}\n`;
    return header + stub;
  }

  private _update(): void {
    const webview = this._panel.webview;

    // convert markdown to sanitized HTML
    const rawMd = this._problem.content_markdown || `# ${this._problem.title}\n\n(No description provided)`;
    const html = marked(rawMd);
    const safe = sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title', 'width', 'height']
      }
    });

    this._panel.webview.html = this._getHtmlForWebview(webview, safe);
  }

  private _getHtmlForWebview(webview: vscode.Webview, contentHtml: string): string {
    // Use a nonce to whitelist scripts
    const nonce = getNonce();
    const samples = this._problem.samples || [];

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(this._problem.title)}</title>
<style>
  body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
  h1 { font-size: 1.4rem; margin-bottom: 0.2rem; }
  .meta { color: var(--vscode-descriptionForeground); margin-bottom: 12px; line-height: 1.5; }
  .difficulty-Easy { color: #6bb341; } /* Green */
  .difficulty-Medium { color: #d49a00; } /* Yellow */
  .difficulty-Hard { color: #e44258; } /* Red */
  .controls { margin-bottom: 12px; display:flex; gap:8px; flex-wrap:wrap; }
  button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    cursor: pointer;
    font-size: 0.9em;
    transition: background 0.2s ease;
  }
  button:hover { background: var(--vscode-button-hoverBackground); }
  .sample { border:1px dashed var(--vscode-editorGutter-background); padding: 10px; margin-bottom:8px; border-radius:6px; }
  .content img { max-width:100%; height:auto; }
  pre { background: rgba(0,0,0,0.06); padding:8px; border-radius:6px; overflow:auto; }
  .samples-container { margin-top: 20px; }
  .sample-case { background: var(--vscode-editorGroup-background); padding: 15px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--vscode-editorGroup-border); }
  .sample-case h3 { margin-top: 0; margin-bottom: 10px; font-size: 1.1em; }
  .sample-case pre { background: var(--vscode-textArea-background); padding: 10px; border-radius: 4px; }
</style>
</head>
<body>
  <h1>${escapeHtml(this._problem.title)}</h1>
  <div class="meta">
    Difficulty: <strong class="difficulty-${this._problem.difficulty}">${escapeHtml(String(this._problem.difficulty || 'Unknown'))}</strong>
    ${this._problem.status ? ` | Status: <strong>${escapeHtml(this._problem.status)}</strong>` : ''}
  </div>

  <div class="controls">
    <button id="open">Open in Editor</button>
    <button id="copy">Copy Template</button>
    ${samples.map((s, i) => `<button class="run-sample" data-idx="${i}">Run Sample ${i+1}</button>`).join('')}
  </div>

  <div class="content">${contentHtml}</div>

  ${samples.length > 0 ? `
    <div class="samples-container">
      <h2>Sample Test Cases</h2>
      ${samples.map((s, i) => `
        <div class="sample-case">
          <h3>Sample ${i + 1}</h3>
          <p><strong>Input:</strong></p>
          <pre>${escapeHtml(s.input)}</pre>
          ${s.output ? `<p><strong>Output:</strong></p><pre>${escapeHtml(s.output)}</pre>` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''}

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.getElementById('open').addEventListener('click', () => {
      vscode.postMessage({ command: 'openInEditor' });
    });
    document.getElementById('copy').addEventListener('click', () => {
      vscode.postMessage({ command: 'copyTemplate' });
    });
    document.querySelectorAll('.run-sample').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx') || 0);
        vscode.postMessage({ command: 'runSample', sampleIndex: idx });
      });
    });
  </script>
</body>
</html>`;
  }
}
