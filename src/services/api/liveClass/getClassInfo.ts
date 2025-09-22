import * as vscode from 'vscode';
import apiUrls from '../../../constants/apiUrls.json';
import { getApiHeaders } from '../../../constants/apiHeaders';
import { getUserId } from '../../auth/getUserId';
import { ClassInfo } from '../../../types';
import { parseClassInfo } from '../../../utils/parse/liveClass/parseClassInfo';

export async function getClassInfo(
    context: vscode.ExtensionContext,
    courseId: string,
): Promise<ClassInfo[]> {

    const url = apiUrls.baseUrl +
                apiUrls.getClassInfo
                    .replace("{{courseId}}", courseId)
                    .replace("{{userId}}", await getUserId(context));

    return await fetch(url, {
        "headers": await getApiHeaders(context),
        "body": null,
        "method": "GET"
    }).then(async(response) => await parseClassInfo(response))
    .catch(error => {
        vscode.window.showErrorMessage(`Error getting class info: ${error}`);
        throw new Error(`Error getting class info: ${error}`);
    });
}