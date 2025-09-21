import * as vscode from 'vscode';
import apiUrls from '../../constants/apiUrls.json';
import { getUserId } from '../auth/getUserId';
import { parseSubmission } from '../../utils/parse/parseSubmission';
import { getApiHeaders } from '../../constants/apiHeaders';

export async function getSubmissions(
    context: vscode.ExtensionContext,
    problemId: string,
    moduleId: string,
): Promise<string[]> {

    const url = apiUrls.baseUrl +
                apiUrls.getSubmissions
                    .replace("{{problemId}}", problemId)
                    .replace("{{userId}}", await getUserId(context))
                    .replace("{{moduleId}}", moduleId);
    
    return fetch(url, {
        "headers": await getApiHeaders(context),
        "body": null,
        "method": "GET"
    }).then(async(response) => await parseSubmission(response))
    .catch(error => {
        vscode.window.showErrorMessage(`Error getting submissions: ${error}`);
        throw new Error(`Error getting submissions: ${error}`);
    });
}