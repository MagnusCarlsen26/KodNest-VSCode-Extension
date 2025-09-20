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

    return this.render();

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
          this.render().catch(error => {
            vscode.window.showErrorMessage(`Failed to refresh problems: ${error}`);
          });
          return;
        }
        case 'filter': {
          this.render(String(msg.query || '')).catch(error => {
            vscode.window.showErrorMessage(`Failed to filter problems: ${error}`);
          });
          return;
        }
      }
    });
  }

  public refresh(): Promise<void> {
    return this.render();
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

  private async render(query: string = ''): Promise<void> {
    if (!this.view) {
      vscode.window.showInformationMessage('Problems Webview: View not yet initialized.');
      return;
    }
    vscode.window.showInformationMessage('Rendering problems...');

    try {
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
      const templatePath = path.join(this.extensionUri.fsPath, 'src', 'templates', 'problems.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      // Replace placeholders
      html = html.replace(/{{nonce}}/g, nonce);
      html = html.replace(/{{query}}/g, escapeHtml(query));

      // Read component templates
      const moduleTemplatePath = path.join(this.extensionUri.fsPath, 'src', 'templates', 'module.html');
      const problemTemplatePath = path.join(this.extensionUri.fsPath, 'src', 'templates', 'problem.html');

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
            .replace(/{{status_meta}}/g, p.status ? ` | Status: ${escapeHtml(p.status)}` : '')
            .replace(/{{topic_meta}}/g, p.topic ? ` | Topic: ${escapeHtml(p.topic)}` : '');

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
          .replace(/{{category_meta}}/g, module.categoryTitle ? ` | ${escapeHtml(module.categoryTitle)}` : '')
          .replace(/{{problems_content}}/g, problemsContent);

        return moduleHtml;
      }).join('');

      // Generate empty message
      const emptyMessage = filteredModules.length === 0 ? `<div class="empty">No problems found.</div>` : '';

      // Replace content placeholders
      html = html.replace(/{{modules_content}}/g, modulesContent);
      html = html.replace(/{{empty_message}}/g, emptyMessage);

      this.view.webview.html = html;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to render problems webview: ${error}`);
    }
  }
}