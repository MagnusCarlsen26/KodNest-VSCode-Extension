import * as vscode from 'vscode';

export async function getUserId(
    context: vscode.ExtensionContext
): Promise<string> {

    const userId = await context.secrets.get('kodnestUserId');

    if (!userId) {
        throw new Error('KodNest user ID not found');
    }

    return userId;
    
}