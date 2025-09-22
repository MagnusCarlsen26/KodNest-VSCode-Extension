import * as vscode from 'vscode';
import apiUrls from '../../constants/apiUrls.json';
import { getApiHeaders } from '../../constants/apiHeaders';
import { getUserId } from '../auth/getUserId';
import { parseScores, Score } from '../../utils/parse/parseScores';

export async function getScores(
    context: vscode.ExtensionContext,
    moduleId: string,
): Promise<Score[]> {

    const url = apiUrls.baseUrl +
                apiUrls.getScores
                    .replace("{{moduleId}}", moduleId)
                    .replace("{{userId}}", await getUserId(context));

    return await fetch(url, {
        "headers": await getApiHeaders(context),
        "body": null,
        "method": "GET"
    }).then(async(response) => await parseScores(response))
    .catch(error => {
        vscode.window.showErrorMessage(`Error getting scores: ${error}`);
        throw new Error(`Error getting scores: ${error}`);
    });

}