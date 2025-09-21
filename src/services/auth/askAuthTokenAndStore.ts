import * as vscode from 'vscode';

export async function askAuthTokenAndStore(
    context: vscode.ExtensionContext
): Promise<void> {

    const token = await vscode.window.showInputBox({
      prompt: 'Enter your KodNest authentication token',
      ignoreFocusOut: true, // Keep the input box open even if focus is lost
    });
  
    if (token) {
      await context.secrets.store('kodnestAuthToken', token);
      vscode.window.showInformationMessage('KodNest authentication token stored securely.');

      const userId = await vscode.window.showInputBox({
        prompt: 'Enter your KodNest user ID',
        ignoreFocusOut: true, // Keep the input box open even if focus is lost
      });

      if (userId) {
        await context.secrets.store('kodnestUserId', userId);
        vscode.window.showInformationMessage('KodNest user ID stored securely.');
      } else {
        vscode.window.showInformationMessage('KodNest user ID not set.');
      }
    } else {
      vscode.window.showInformationMessage('KodNest authentication token not set.');
    }
  }