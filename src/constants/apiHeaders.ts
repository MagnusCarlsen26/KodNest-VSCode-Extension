import * as vscode from 'vscode';
import { getAuthToken } from "../services/auth/getAuthToken";

export interface ApiHeaders {
    [key: string]: string;
    accept: string;
    authorization: string;
}

export async function getApiHeaders(
    context: vscode.ExtensionContext
) : Promise<ApiHeaders> {

    return {
        "accept": "application/json, text/plain, */*",
        "authorization": await getAuthToken(context)
    };
}