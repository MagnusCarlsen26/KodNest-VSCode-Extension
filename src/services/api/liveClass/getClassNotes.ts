import * as vscode from 'vscode';
import apiUrls from '../../../constants/apiUrls.json';
import { getApiHeaders } from '../../../constants/apiHeaders';
import { getUserId } from '../../auth/getUserId';
import { ClassNotes } from '../../../types';
import { parseNotes } from '../../../utils/parse/liveClass/parseClassNotes';

export async function getClassNotes(
    context: vscode.ExtensionContext,
    courseId: string,
    moduleId: string,
    topicId: string,
    subTopicId: string
): Promise<ClassNotes> {

    const url = apiUrls.baseUrl + 
                apiUrls.getClassSubTopicNotes
                    .replace("{{courseId}}", courseId)
                    .replace("{{userId}}", await getUserId(context))
                    .replace("{{moduleId}}", moduleId)
                    .replace("{{topicId}}", topicId)
                    .replace("{{subTopicId}}", subTopicId);

    return await fetch(url, {
        "headers": await getApiHeaders(context),
        "body": null,
        "method": "GET"
    }).then(async(response) => await parseNotes(response))
    .catch(error => {
        vscode.window.showErrorMessage(`Error getting class sub topic notes: ${error}`);
        throw new Error(`Error getting class sub topic notes: ${error}`);
    });
}