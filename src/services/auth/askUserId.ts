import * as vscode from 'vscode';

export async function askUserIdAndStore(
    context: vscode.ExtensionContext
): Promise<string> {
    
    const userId = await vscode.window.showInputBox({
        prompt: 'Please enter your KodNest user ID',
        ignoreFocusOut: true,
        validateInput: (value: string) => {
            if (!value) {
                return 'User ID cannot be empty.';
            }
            return null;
        },
    });

    if (userId) {
        await context.secrets.store('kodnestUserId', userId);
        return userId;
    } else {
        throw new Error('User ID not provided');
    }
}
