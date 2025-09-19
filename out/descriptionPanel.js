"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemDescriptionPanel = void 0;
const vscode = __importStar(require("vscode"));
// Use dynamic import wrappers to avoid ESM/CJS interop issues under Node16 module resolution
// while keeping the call sites typed.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { marked } = require('marked');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sanitizeHtml = require('sanitize-html');
const utils_1 = require("./utils");
class ProblemDescriptionPanel {
    static currentPanel;
    _panel;
    _extensionUri;
    _disposables = [];
    _problem;
    constructor(panel, extensionUri, problem) {
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
    static createOrShow(extensionUri, problem) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        // If we already have a panel, reveal it
        if (ProblemDescriptionPanel.currentPanel) {
            ProblemDescriptionPanel.currentPanel._panel.reveal(column);
            ProblemDescriptionPanel.currentPanel.updateProblem(problem);
            return;
        }
        // Otherwise create a new panel
        const panel = vscode.window.createWebviewPanel('kodnest.problemDescription', `${problem.id} — ${problem.title}`, column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [extensionUri]
        });
        ProblemDescriptionPanel.currentPanel = new ProblemDescriptionPanel(panel, extensionUri, problem);
    }
    updateProblem(problem) {
        this._problem = problem;
        this._panel.title = `${problem.id} — ${problem.title}`;
        this._update();
    }
    dispose() {
        ProblemDescriptionPanel.currentPanel = undefined;
        // Clean up
        this._panel.dispose();
        while (this._disposables.length) {
            const d = this._disposables.pop();
            if (d)
                d.dispose();
        }
    }
    _handleMessage(msg) {
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
    _generateTemplate() {
        const lang = 'javascript';
        const header = `// ${this._problem.title} (${this._problem.id})\n// Difficulty: ${this._problem.difficulty || 'Unknown'}\n\n`;
        const stub = `function solution() {\n  // TODO\n}\n`;
        return header + stub;
    }
    _update() {
        const webview = this._panel.webview;
        // convert markdown to sanitized HTML
        const rawMd = this._problem.content_markdown || `# ${this._problem.title}\n\n(No description provided)`;
        const html = marked(rawMd);
        const safe = sanitizeHtml(html, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                img: ['src', 'alt', 'title', 'width', 'height']
            }
        });
        this._panel.webview.html = this._getHtmlForWebview(webview, safe);
    }
    _getHtmlForWebview(webview, contentHtml) {
        // Use a nonce to whitelist scripts
        const nonce = (0, utils_1.getNonce)();
        const samples = this._problem.samples || [];
        return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${(0, utils_1.escapeHtml)(this._problem.title)}</title>
<style>
  body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
  h1 { font-size: 1.4rem; margin-bottom: 0.2rem; }
  .meta { color: var(--vscode-descriptionForeground); margin-bottom: 12px; }
  .controls { margin-bottom: 12px; display:flex; gap:8px; flex-wrap:wrap; }
  button { padding:6px 10px; border-radius:6px; border: 1px solid var(--vscode-button-border); background: var(--vscode-button-background); color: var(--vscode-button-foreground); cursor:pointer; }
  .sample { border:1px dashed var(--vscode-editorGutter-background); padding: 10px; margin-bottom:8px; border-radius:6px; }
  .content img { max-width:100%; height:auto; }
  pre { background: rgba(0,0,0,0.06); padding:8px; border-radius:6px; overflow:auto; }
</style>
</head>
<body>
  <h1>${(0, utils_1.escapeHtml)(this._problem.title)} <small style="opacity:.7">(${(0, utils_1.escapeHtml)(this._problem.id)})</small></h1>
  <div class="meta">Difficulty: <strong>${(0, utils_1.escapeHtml)(String(this._problem.difficulty || 'Unknown'))}</strong></div>

  <div class="controls">
    <button id="open">Open in Editor</button>
    <button id="copy">Copy Template</button>
    ${samples.map((s, i) => `<button class="run-sample" data-idx="${i}">Run Sample ${i + 1}</button>`).join('')}
  </div>

  <div class="content">${contentHtml}</div>

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
exports.ProblemDescriptionPanel = ProblemDescriptionPanel;
//# sourceMappingURL=descriptionPanel.js.map