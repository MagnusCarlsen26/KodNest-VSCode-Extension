import * as vscode from 'vscode';
import { getNonce, escapeHtml, getTemplatesRootPath } from '../utils';
import { getClassInfo } from '../services/api/liveClass/getClassInfo';
import { ClassInfo } from '../types';

export class LiveClassWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'liveClass';

  private view: vscode.WebviewView | undefined;
  private readonly extensionUri: vscode.Uri;
  private readonly context: vscode.ExtensionContext;

  constructor(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    this.extensionUri = extensionUri;
    this.context = context;
    this.loadAndRenderClasses(); // Initial load
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    // receive messages from webview
    webviewView.webview.onDidReceiveMessage(msg => {
      switch (msg.command) {
        case 'openLiveClass':
          vscode.commands.executeCommand('kodnest.openLiveClass', msg.classId);
          break;
        default:
          console.log('Unknown message:', msg);
      }
    });

    return this.loadAndRenderClasses();
  }

  public refresh(): Promise<void> {
    return this.loadAndRenderClasses();
  }

  private async loadAndRenderClasses(): Promise<void> {
    try {
      const courseId = "dummyCourseId"; 
      const liveClasses = await getClassInfo(this.context, courseId);
      this.render(liveClasses);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load live classes: ${error}`);
    }
  }

  private async render(filteredClasses: ClassInfo[]): Promise<void> {
    if (!this.view) {
      vscode.window.showInformationMessage('Live Class Webview: View not yet initialized.');
      return;
    }

    try {
      const nonce = getNonce();

      // Read the HTML template
      const fs = await import('fs');
      const path = await import('path');
      const templatesRoot = getTemplatesRootPath(this.extensionUri);
      const templatePath = path.join(templatesRoot, 'sidebar', 'liveClass.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      // Replace placeholders
      html = html.replace(/{{nonce}}/g, nonce);

      // Generate live class content
      const classTemplatePath = path.join(templatesRoot, 'sidebar', 'liveClassItem.html');
      const classTemplate = fs.readFileSync(classTemplatePath, 'utf-8');

      const classesContent = filteredClasses.map(cls => {
        const attendancePercentage = cls.attendancePercentage > 100 ? 100 : cls.attendancePercentage < 0 ? 0 : cls.attendancePercentage;

        return classTemplate
          .replace(/{{class_id}}/g, escapeHtml(cls.courseId))
          .replace(/{{class_title}}/g, escapeHtml(cls.courseName))
          .replace(/{{total_sessions}}/g, escapeHtml(cls.totalSessions.toString()))
          .replace(/{{total_present}}/g, escapeHtml(cls.totalPresent.toString()))
          .replace(/{{total_absent}}/g, escapeHtml(cls.totalAbsent.toString()))
          .replace(/{{attendance_percentage}}/g, escapeHtml(attendancePercentage.toString()));
      }).join('');

      // Generate empty message
      const emptyTemplatePath = path.join(templatesRoot, 'empty.html');
      const emptyTemplate = fs.readFileSync(emptyTemplatePath, 'utf-8');
      const emptyMessage = filteredClasses.length === 0
        ? emptyTemplate.replace(/{{message}}/g, 'No live classes scheduled.')
        : '';

      // Replace content placeholders
      html = html.replace(/{{classes_content}}/g, classesContent);
      html = html.replace(/{{empty_message}}/g, emptyMessage);

      this.view.webview.html = html;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to render live class webview: ${error}`);
    }
  }
}
