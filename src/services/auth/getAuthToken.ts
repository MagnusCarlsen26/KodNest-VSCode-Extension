import * as vscode from 'vscode';

export async function getAuthToken(
    context: vscode.ExtensionContext
): Promise<string> {

    const token = await context.secrets.get('kodnestAuthToken');
    
    if (!token) {
        throw new Error('KodNest authentication token not found');
    }

    return token;
}