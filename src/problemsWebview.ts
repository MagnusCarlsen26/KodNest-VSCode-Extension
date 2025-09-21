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

    // receive messages from webview
    webviewView.webview.onDidReceiveMessage(msg => {
      if (msg.command === 'openProblem') {
        // forward to extension command which will open the description panel
        vscode.commands.executeCommand('kodnest.openProblem', msg.id);
      }
    });

    return this.render();
  }

  public refresh(): Promise<void> {
    return this.render();
  }

  private getStatusMeta(status: string | undefined): string {
    if (!status) {
      return '';
    }

    const normalizedStatus = status.toLowerCase().trim();

    // Don't show anything for not attempted/NA status
    if (normalizedStatus === 'na' ||
        normalizedStatus === 'not_attempted' ||
        normalizedStatus === 'not attempted' ||
        normalizedStatus === 'pending' ||
        normalizedStatus === '') {
      return '';
    }

    // Don't show tick in meta since it's now shown separately
    if (normalizedStatus === 'completed' ||
        normalizedStatus === 'solved' ||
        normalizedStatus === 'done') {
      return '';
    }

    // For other statuses, show them as text
    return ` | Status: ${escapeHtml(status)}`;
  }

  private getStatusIndicator(status: string | undefined): string {
    if (!status) {
      return '';
    }

    const normalizedStatus = status.toLowerCase().trim();

    // Show green tick for completed status
    if (normalizedStatus === 'completed' ||
        normalizedStatus === 'solved' ||
        normalizedStatus === 'done') {
      return '<span style="color: #6bb341; font-weight: bold;">✓</span>';
    }

    return '';
  }

  private getStatusClass(status: string | undefined): string {
    if (!status) {
      return '';
    }

    const normalizedStatus = status.toLowerCase().trim();
    if (normalizedStatus === 'completed' || normalizedStatus === 'solved' || normalizedStatus === 'done') {
      return 'status-completed';
    }
    return 'status-other';
  }

  private getMetaStyle(status: string | undefined, topic: string | undefined): string {
    const statusMeta = this.getStatusMeta(status);

    // Hide meta div if there's no content to show
    if (!statusMeta && !topic) {
      return 'display: none;';
    }

    return '';
  }

  private async render(query: string = ''): Promise<void> {
    if (!this.view) {
      vscode.window.showInformationMessage('Problems Webview: View not yet initialized.');
      return;
    }

    try {
      const nonce = getNonce();
      const allModules = this.problemProvider.getChildren() as Module[];

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

      // Helper function to get difficulty CSS class
      const getDifficultyClass = (difficulty: string): string => {
        switch (difficulty.toUpperCase()) {
          case 'EASY':
          case 'BEGINNER':
            return 'module-difficulty-Easy';
          case 'MEDIUM':
          case 'INTERMEDIATE':
            return 'module-difficulty-Medium';
          case 'HARD':
          case 'ADVANCED':
            return 'module-difficulty-Hard';
          default:
            return '';
        }
      };

      // Read the HTML template
      const fs = await import('fs');
      const path = await import('path');
      const templatePath = path.join(this.extensionUri.fsPath, 'src', 'templates', 'sidebar', 'problems.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      // Replace placeholders
      html = html.replace(/{{nonce}}/g, nonce);
      html = html.replace(/{{query}}/g, escapeHtml(query));

      // Read component templates
      const moduleTemplatePath = path.join(this.extensionUri.fsPath, 'src', 'templates', 'sidebar', 'module.html');
      const problemTemplatePath = path.join(this.extensionUri.fsPath, 'src', 'templates', 'sidebar', 'problem.html');

      const moduleTemplate = fs.readFileSync(moduleTemplatePath, 'utf-8');
      const problemTemplate = fs.readFileSync(problemTemplatePath, 'utf-8');

      // Generate modules content using templates
      const modulesContent = filteredModules.map(module => {
        // Generate problems content first
        const problemsContent = module.problems.map(p => {
          let problemHtml = problemTemplate
            .replace(/{{problem_id}}/g, escapeHtml(p.id))
            .replace(/{{problem_title}}/g, escapeHtml(p.title))
            .replace(/{{difficulty}}/g, escapeHtml(p.difficulty))
            .replace(/{{status_indicator}}/g, this.getStatusIndicator(p.status))
            .replace(/{{status_class}}/g, this.getStatusClass(p.status))
            .replace(/{{status_meta}}/g, this.getStatusMeta(p.status))
            .replace(/{{topic_meta}}/g, p.topic ? ` | Topic: ${escapeHtml(p.topic)}` : '')
            .replace(/{{meta_style}}/g, this.getMetaStyle(p.status, p.topic));

          return problemHtml;
        }).join('');

        // Generate module HTML
        let moduleHtml = moduleTemplate
          .replace(/{{collapsed_class}}/g, 'collapsed')
          .replace(/{{difficulty_class}}/g, getDifficultyClass(module.difficulty))
          .replace(/{{module_id}}/g, escapeHtml(module.id))
          .replace(/{{arrow}}/g, '▶')
          .replace(/{{module_name}}/g, escapeHtml(module.name))
          .replace(/{{difficulty}}/g, escapeHtml(module.difficulty))
          .replace(/{{solved_count}}/g, String(module.problems.filter(p => p.status === 'solved').length))
          .replace(/{{total_count}}/g, String(module.problems.length))
          .replace(/{{problems_content}}/g, problemsContent);

        return moduleHtml;
      }).join('');

      // Generate empty message
      const emptyTemplatePath = path.join(this.extensionUri.fsPath, 'src', 'templates', 'empty.html');
      const emptyTemplate = fs.readFileSync(emptyTemplatePath, 'utf-8');
      const emptyMessage = filteredModules.length === 0
        ? emptyTemplate.replace(/{{message}}/g, 'No problems found.')
        : '';

      // Replace content placeholders
      html = html.replace(/{{modules_content}}/g, modulesContent);
      html = html.replace(/{{empty_message}}/g, emptyMessage);

      this.view.webview.html = html;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to render problems webview: ${error}`);
    }
  }
}