import * as vscode from 'vscode';
import { ProblemDescriptionPanel } from '../ui/descriptionPanel';
import { ProblemMeta } from '../types';

export function registerProblemDescriptionPanelSerializer(context: vscode.ExtensionContext, extensionUri: vscode.Uri) {
  try {
    vscode.window.registerWebviewPanelSerializer('kodnest.problemDescription', {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
        try {
          const stored: ProblemMeta | undefined = context.workspaceState.get('kodnest.lastProblemMeta');
          if (stored) {
            ProblemDescriptionPanel.revive(webviewPanel, extensionUri, stored);
          } else {
            const fallback: ProblemMeta = { id: 'unknown', title: 'Problem', content_markdown: '# Problem', samples: [] } as any;
            ProblemDescriptionPanel.revive(webviewPanel, extensionUri, fallback);
          }
        } catch (e) {
          console.warn('Failed to deserialize problem description panel', e);
        }
      }
    });
  } catch (e) {
    console.warn('WebviewPanelSerializer registration failed', e);
  }
}
