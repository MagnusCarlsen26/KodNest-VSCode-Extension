import * as vscode from 'vscode';
import { getNonce, escapeHtml, getTemplatesRootPath } from '../utils';

export class LiveClassWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'liveClass';

  private view: vscode.WebviewView | undefined;
  private readonly extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
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
        case 'refresh':
          this.refresh();
          break;
        case 'filter':
          this.render(msg.query);
          break;
        case 'joinLiveSession':
          vscode.commands.executeCommand('kodnest.joinLiveSession', msg.sessionId);
          break;
        case 'viewRecording':
          vscode.commands.executeCommand('kodnest.viewRecording', msg.classId);
          break;
        default:
          console.log('Unknown message:', msg);
      }
    });

    return this.render();
  }

  public refresh(): Promise<void> {
    return this.render();
  }

  private async render(query: string = ''): Promise<void> {
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

      // Sample live class data - you can replace this with actual data from your API
      const liveClasses = [
        {
          id: 'class1',
          title: 'Advanced Java Programming',
          instructor: 'John Doe',
          startTime: '2025-01-15T10:00:00Z',
          duration: '90 minutes',
          status: 'upcoming',
          participants: 25
        },
        {
          id: 'class2',
          title: 'Data Structures and Algorithms',
          instructor: 'Jane Smith',
          startTime: '2025-01-15T14:00:00Z',
          duration: '120 minutes',
          status: 'live',
          participants: 45
        },
        {
          id: 'class3',
          title: 'Database Design',
          instructor: 'Bob Johnson',
          startTime: '2025-01-14T16:00:00Z',
          duration: '60 minutes',
          status: 'completed',
          participants: 30
        }
      ];

      // Filter classes based on query
      let filteredClasses = liveClasses;
      if (query) {
        filteredClasses = liveClasses.filter(cls =>
          cls.title.toLowerCase().includes(query.toLowerCase()) ||
          cls.instructor.toLowerCase().includes(query.toLowerCase()) ||
          cls.id.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Generate live class content
      const classTemplatePath = path.join(templatesRoot, 'sidebar', 'liveClassItem.html');
      const classTemplate = fs.readFileSync(classTemplatePath, 'utf-8');

      const classesContent = filteredClasses.map(cls => {
        const startDate = new Date(cls.startTime);
        const formattedDate = startDate.toLocaleDateString();
        const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let statusClass = '';
        let statusText = '';
        let actionButton = '';

        switch (cls.status) {
          case 'live':
            statusClass = 'status-live';
            statusText = '🔴 LIVE NOW';
            actionButton = '<button class="join-btn" onclick="joinClass(\'' + cls.id + '\')">Join Now</button>';
            break;
          case 'upcoming':
            statusClass = 'status-upcoming';
            statusText = '⏰ Upcoming';
            actionButton = '<button class="join-btn" onclick="joinClass(\'' + cls.id + '\')">Join Class</button>';
            break;
          case 'completed':
            statusClass = 'status-completed';
            statusText = '✅ Completed';
            actionButton = '<button class="view-btn" onclick="viewRecording(\'' + cls.id + '\')">View Recording</button>';
            break;
        }

        return classTemplate
          .replace(/{{class_id}}/g, escapeHtml(cls.id))
          .replace(/{{class_title}}/g, escapeHtml(cls.title))
          .replace(/{{instructor}}/g, escapeHtml(cls.instructor))
          .replace(/{{date}}/g, escapeHtml(formattedDate))
          .replace(/{{time}}/g, escapeHtml(formattedTime))
          .replace(/{{duration}}/g, escapeHtml(cls.duration))
          .replace(/{{participants}}/g, escapeHtml(cls.participants.toString()))
          .replace(/{{status_class}}/g, statusClass)
          .replace(/{{status_text}}/g, statusText)
          .replace(/{{action_button}}/g, actionButton);
      }).join('');

      // Generate empty message
      const emptyTemplatePath = path.join(templatesRoot, 'empty.html');
      const emptyTemplate = fs.readFileSync(emptyTemplatePath, 'utf-8');
      const emptyMessage = filteredClasses.length === 0
        ? emptyTemplate.replace(/{{message}}/g, query ? 'No classes found matching your search.' : 'No live classes scheduled.')
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
