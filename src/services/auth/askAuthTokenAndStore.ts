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

export async function askFetchRequestAndStore(
    context: vscode.ExtensionContext
): Promise<void> {
    const fetchRequestText = await vscode.window.showInputBox({
        prompt: 'Paste the entire fetch request text here',
        ignoreFocusOut: true,
        placeHolder: 'e.g., fetch("https://api.kodnest.in/...", { ... })'
    });

    if (!fetchRequestText) {
        vscode.window.showInformationMessage('Fetch request text not provided.');
        return;
    }

    const authTokenMatch = fetchRequestText.match(/"authorization":\s*"(Bearer\s[^"]+)"/);
    const userIdMatch = fetchRequestText.match(/"sub":\s*"([^"]+)"/);

    if (authTokenMatch && authTokenMatch[1]) {
        const token = authTokenMatch[1];
        await context.secrets.store('kodnestAuthToken', token);
        vscode.window.showInformationMessage('KodNest authentication token stored securely.');
    } else {
        vscode.window.showInformationMessage('Could not extract authentication token from the fetch request.');
    }

    if (userIdMatch && userIdMatch[1]) {
        const userId = userIdMatch[1];
        await context.secrets.store('kodnestUserId', userId);
        vscode.window.showInformationMessage('KodNest user ID stored securely.');
    } else {
        vscode.window.showInformationMessage('Could not extract user ID from the fetch request.');
    }

    const link = await vscode.window.showInputBox({
        prompt: 'Enter the relevant link',
        ignoreFocusOut: true,
        placeHolder: 'e.g., https://app.kodnest.com/courses'
    });

    if (link) {
        // TODO: Store the link if needed, or just acknowledge it.
        vscode.window.showInformationMessage(`Link provided: ${link}`);
    } else {
        vscode.window.showInformationMessage('No link provided.');
    }
}

export async function deleteAuthToken(
    context: vscode.ExtensionContext
): Promise<void> {
    await context.secrets.delete('kodnestAuthToken');
    vscode.window.showInformationMessage('KodNest authentication token has been deleted.');
}

export async function deleteUserId(
    context: vscode.ExtensionContext
): Promise<void> {
    await context.secrets.delete('kodnestUserId');
    vscode.window.showInformationMessage('KodNest user ID has been deleted.');
}