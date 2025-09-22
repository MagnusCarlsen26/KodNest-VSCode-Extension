import { askUserIdAndStore } from "../services/auth/askUserId";
import { askAuthTokenAndStore } from "../services/auth/askAuthTokenAndStore";
import * as vscode from 'vscode';

export async function getAllTokens(
    context: vscode.ExtensionContext
) : Promise<void> {

    if (!(await context.secrets.get('kodnestAuthToken'))) {
        await askAuthTokenAndStore(context);
    }

    if (!(await context.secrets.get('kodnestUserId'))) {
        await askUserIdAndStore(context);
    }

}