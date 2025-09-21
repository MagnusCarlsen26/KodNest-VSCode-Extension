import * as vscode from 'vscode';
import { Verdict } from './types';
import * as fs from 'fs';
import * as path from 'path';

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

  private async _update(): Promise<void> {
    const webview = this._panel.webview;
    webview.html = await this._getHtmlForWebview();
  }

  private async _getHtmlForWebview(): Promise<string> {

    console.log(this._verdicts);

    const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'templates', 'verdict.html');
    let htmlContent = await fs.promises.readFile(htmlPath, 'utf8');

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
    const overallClass = overall === 'Accepted' ? 'ok' : 'fail';

    htmlContent = htmlContent.replace('{{overallClass}}', overallClass);
    htmlContent = htmlContent.replace('{{overallStatus}}', overall);
    htmlContent = htmlContent.replace('{{verdictRows}}', rows);

    return htmlContent;
  }

  private _computeOverallStatus(): string {
    if (!this._verdicts || this._verdicts.length === 0) { return 'Pending'; }
    const allOk = this._verdicts.every(v => (v.status || '').toLowerCase().includes('accepted'));
    return allOk ? 'Accepted' : 'Failed';
  }

  private _statusClass(status: string): string {
    if ((status || '').toLowerCase().includes('accepted')) { return 'ok'; } else { return 'fail'; }
  }

  private _escape(text: string): string {
    if (!text) { return ''; }
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}


