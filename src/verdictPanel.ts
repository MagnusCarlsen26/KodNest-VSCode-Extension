import * as vscode from 'vscode';
import { Verdict } from './types';

export class VerdictPanel {
  public static currentPanel: VerdictPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _verdicts: Verdict[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, verdicts: Verdict[]) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._verdicts = verdicts;

    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, verdicts: Verdict[]): void {
    const column = vscode.ViewColumn.Two;

    if (VerdictPanel.currentPanel) {
      VerdictPanel.currentPanel._panel.reveal(column, true);
      VerdictPanel.currentPanel.updateVerdicts(verdicts);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'kodnest.verdict',
      'Verdict',
      column,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
        retainContextWhenHidden: true
      }
    );

    VerdictPanel.currentPanel = new VerdictPanel(panel, extensionUri, verdicts);
  }

  public static async showOnRight(extensionUri: vscode.Uri, verdicts: Verdict[]): Promise<void> {
    // Do not force a split; always target ViewColumn.Two.
    // VS Code will create a second group if absent, or reuse the existing right group.
    VerdictPanel.createOrShow(extensionUri, verdicts);
  }

  public updateVerdicts(verdicts: Verdict[]): void {
    this._verdicts = verdicts;
    this._update();
  }

  public dispose(): void {
    VerdictPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) { d.dispose(); }
    }
  }

  private _update(): void {
    const webview = this._panel.webview;
    webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview(): string {
    const rows = this._verdicts.map((v, i) => `
      <div class="case">
        <div class="row"><span class="label">Test ${i + 1}:</span> <span class="status ${this._statusClass(v.status)}">${this._escape(v.status)}</span></div>
        ${v.stdin ? `<details><summary>stdin</summary><pre>${this._escape(v.stdin)}</pre></details>` : ''}
        ${v.stdout ? `<details><summary>stdout</summary><pre>${this._escape(v.stdout)}</pre></details>` : ''}
        ${v.expectedOutput ? `<details><summary>expected</summary><pre>${this._escape(v.expectedOutput)}</pre></details>` : ''}
        ${v.stderr ? `<details><summary>stderr</summary><pre>${this._escape(v.stderr)}</pre></details>` : ''}
        ${v.compileOutput ? `<details><summary>compile output</summary><pre>${this._escape(v.compileOutput)}</pre></details>` : ''}
        ${v.time ? `<div class="row"><span class="label">time:</span> <code>${this._escape(v.time)}</code></div>` : ''}
      </div>
    `).join('');

    const overall = this._computeOverallStatus();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verdict</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 12px; color: var(--vscode-foreground); }
          .header { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
          .badge { padding:2px 8px; border-radius: 999px; font-weight: 600; }
          .ok { background: #1b5e20; color: #fff; }
          .fail { background: #b71c1c; color: #fff; }
          .case { border: 1px solid var(--vscode-editorWidget-border); border-radius:6px; padding:8px; margin-bottom:8px; }
          .row { margin: 4px 0; }
          .label { color: var(--vscode-descriptionForeground); margin-right: 6px; }
          details { margin-top: 6px; }
          pre { background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 8px; border-radius: 4px; overflow: auto; }
          .status.ok { color: #2e7d32; font-weight: 600; }
          .status.fail { color: #d32f2f; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin:0;">Verdict</h2>
          <span class="badge ${overall === 'Accepted' ? 'ok' : 'fail'}">${overall}</span>
        </div>
        ${rows}
      </body>
      </html>
    `;
  }

  private _computeOverallStatus(): string {
    if (!this._verdicts || this._verdicts.length === 0) return 'Pending';
    const allOk = this._verdicts.every(v => (v.status || '').toLowerCase().includes('accepted'));
    return allOk ? 'Accepted' : 'Failed';
  }

  private _statusClass(status: string): string {
    return (status || '').toLowerCase().includes('accepted') ? 'ok' : 'fail';
  }

  private _escape(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}


