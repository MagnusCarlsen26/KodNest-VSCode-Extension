import * as vscode from 'vscode';
import apiUrls from "../../../constants/apiUrls.json";
import { getApiHeaders } from "../../../constants/apiHeaders";
import { parseClassTopics } from '../../../utils/parse/liveClass/parseClassTopics';
import { ClassTopic } from '../../../types';

export async function getClassTopics(
    context: vscode.ExtensionContext, 
    courseId: string,
    moduleId: string,
): Promise<ClassTopic[]> {

    const url = apiUrls.baseUrl + 
                apiUrls.getClassTopics
                    .replace("{{courseId}}", courseId)
                    .replace("{{moduleId}}", moduleId)

    return await fetch(url, {
        "headers": await getApiHeaders(context),
        "body": null,
        "method": "GET"
      }).then(async(response) => await parseClassTopics(response))
      .catch(error => {
        vscode.window.showErrorMessage(`Error getting class topics: ${error}`);
        throw new Error(`Error getting class topics: ${error}`);
      });
}