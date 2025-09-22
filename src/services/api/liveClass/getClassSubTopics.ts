import * as vscode from 'vscode';
import apiUrls from "../../../constants/apiUrls.json";
import { getApiHeaders } from "../../../constants/apiHeaders";
import { parseClassSubTopics } from '../../../utils/parse/liveClass/parseClassSubtopic';
import { ClassSubtopic } from '../../../types';
import { getUserId } from '../../auth/getUserId';

export async function getClassSubTopics(
    context: vscode.ExtensionContext, 
    courseId: string,
    moduleId: string,
    topicId: string,
): Promise<ClassSubtopic[]> {

    const url = apiUrls.baseUrl + 
                apiUrls.getClassSubTopics
                    .replace("{{courseId}}", courseId)
                    .replace("{{moduleId}}", moduleId)
                    .replace("{{topicId}}", topicId)
                    .replace("{{userId}}", await getUserId(context));

    return await fetch(url, {
        "headers": await getApiHeaders(context),
        "body": null,
        "method": "GET"
    }).then(async(response) => await parseClassSubTopics(response))
    .catch(error => {
        vscode.window.showErrorMessage(`Error getting class sub topics: ${error}`);
        throw new Error(`Error getting class sub topics: ${error}`);
    });

}