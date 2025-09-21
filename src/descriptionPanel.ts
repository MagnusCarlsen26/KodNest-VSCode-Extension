import * as vscode from 'vscode';
// Use dynamic import wrappers to avoid ESM/CJS interop issues under Node16 module resolution
// while keeping the call sites typed.
const { marked } = require('marked');
const sanitizeHtml: any = require('sanitize-html');
import { ProblemMeta } from './types';
import { escapeHtml, getNonce } from './utils';

// Helper function to truncate long titles
function truncateTitle(title: string, maxLength: number = 50): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.substring(0, maxLength - 3) + '...';
}

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
      truncateTitle(problem.title),
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
    this._panel.title = truncateTitle(problem.title);
    this._update();
  }

  public dispose(): void {
    ProblemDescriptionPanel.currentPanel = undefined;

    // Clean up
    this._panel.dispose();

    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) { d.dispose(); }
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

    try {
      const fs = require('fs');
      const path = require('path');

      // Read templates from src/templates to keep a single source of truth
      const templatesDir = path.join(this._extensionUri.fsPath, 'src', 'templates');
      const templatePath = path.join(templatesDir, 'description.html');
      const samplesTemplatePath = path.join(templatesDir, 'samples.html');
      const sampleItemTemplatePath = path.join(templatesDir, 'sample-item.html');
      const sampleOutputTemplatePath = path.join(templatesDir, 'sample-output.html');

      let html = fs.readFileSync(templatePath, 'utf-8');
      const samplesTemplate = fs.readFileSync(samplesTemplatePath, 'utf-8');
      const sampleItemTemplate = fs.readFileSync(sampleItemTemplatePath, 'utf-8');
      const sampleOutputTemplate = fs.readFileSync(sampleOutputTemplatePath, 'utf-8');

      // Build samples section from templates
      let samplesSection = '';
      if (samples.length > 0) {
        const items = samples.map((s: any, i: number) => {
          const outputBlock = s.output
            ? sampleOutputTemplate.replace(/{{output}}/g, escapeHtml(s.output))
            : '';
          return sampleItemTemplate
            .replace(/{{index}}/g, String(i + 1))
            .replace(/{{input}}/g, escapeHtml(s.input))
            .replace(/{{output_block}}/g, outputBlock);
        }).join('');
        samplesSection = samplesTemplate.replace(/{{sample_items}}/g, items);
      }

      // Replace placeholders in main template
      html = html.replace(/{{nonce}}/g, nonce);
      html = html.replace(/{{title}}/g, escapeHtml(this._problem.title));
      html = html.replace(/{{difficulty}}/g, escapeHtml(String(this._problem.difficulty || 'Unknown')));
      html = html.replace(/{{status_meta}}/g,
        this._problem.status ? ` | Status: <strong>${escapeHtml(this._problem.status)}</strong>` : ''
      );
      html = html.replace(/{{sample_buttons}}/g, '');
      html = html.replace(/{{samples_section}}/g, samplesSection);
      html = html.replace(/{{content}}/g, contentHtml);

      return html;
    } catch (error) {
      console.warn('Failed to read HTML templates:', error);
      return '';
    }
  }
}
