import * as vscode from 'vscode';
import { Verdict } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { getTemplatesRootPath } from '../utils';

export class VerdictPanel {
  public static currentPanel: VerdictPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _verdicts: Verdict[] = [];
  private _problemName: string;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, verdicts: Verdict[], problemName: string) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._verdicts = verdicts;
    this._problemName = problemName;

    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, verdicts: Verdict[], problemName?: string): void {
    // Ensure we have a valid problem name - use the first verdict's problemName if available, otherwise use parameter
    const finalProblemName = problemName && problemName.trim()
      ? problemName.trim()
      : verdicts[0]?.problemName || 'Unknown Problem';
    const column = vscode.ViewColumn.Two;

    if (VerdictPanel.currentPanel) {
      VerdictPanel.currentPanel._panel.reveal(column, true);
      VerdictPanel.currentPanel.updateVerdicts(verdicts, finalProblemName);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'kodnest.verdict',
      `Verdict: ${finalProblemName}`,
      column,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
        retainContextWhenHidden: true
      }
    );

    VerdictPanel.currentPanel = new VerdictPanel(panel, extensionUri, verdicts, finalProblemName);
  }

  public static async showOnRight(extensionUri: vscode.Uri, verdicts: Verdict[], problemName?: string): Promise<void> {
    // Do not force a split; always target ViewColumn.Two.
    // VS Code will create a second group if absent, or reuse the existing right group.
    VerdictPanel.createOrShow(extensionUri, verdicts, problemName);
  }

  public updateVerdicts(verdicts: Verdict[], problemName?: string): void {
    this._verdicts = verdicts;
    if (problemName) {
      this._problemName = problemName;
    }
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

    const templatesRoot = getTemplatesRootPath(this._extensionUri);
    const htmlPath = path.join(templatesRoot, 'verdict.html');
    let htmlContent = await fs.promises.readFile(htmlPath, 'utf8');

    const rows = this._verdicts.map((v, i) => {
      const lowerCaseStatus = (v.status || '').toLowerCase();
      const shouldExpandDetails = lowerCaseStatus === 'wrong answer' ||
                                  lowerCaseStatus.includes('error') ||
                                  lowerCaseStatus.includes('failed') ||
                                  lowerCaseStatus.includes('time limit exceeded');
      const openAttribute = shouldExpandDetails ? 'open' : '';
      return `
      <div class="case">
        <div class="row"><span class="label">Test ${i + 1}:</span> <span class="status ${this._statusClass(v.status)}">${this._escape(v.status)}</span></div>
        ${v.stdin ? `<details ${openAttribute}><summary>stdin</summary><code>${this._escape(v.stdin)}</code></details>` : ''}
        ${v.stdout ? `<details ${openAttribute}><summary>stdout</summary><code>${this._escape(v.stdout)}</code></details>` : ''}
        ${v.expectedOutput ? `<details ${openAttribute}><summary>expected</summary><code>${this._escape(v.expectedOutput)}</code></details>` : ''}
        ${v.stderr ? `<details ${openAttribute}><summary>stderr</summary><code>${this._escape(v.stderr)}</code></details>` : ''}
        ${v.compileOutput ? `<details ${openAttribute}><summary>compile output</summary><code>${this._escape(v.compileOutput)}</code></details>` : ''}
        ${v.time ? `<div class="row"><span class="label">time:</span> <code>${this._escape(v.time)}</code></div>` : ''}
      </div>
    `;}).join('');

    const overall = this._computeOverallStatus();
    const overallClass = overall === 'Accepted' ? 'ok' : 'fail';

    htmlContent = htmlContent.replace('{{problemName}}', this._escape(this._problemName));
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


