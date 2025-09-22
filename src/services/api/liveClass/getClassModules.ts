import * as vscode from 'vscode';
import apiUrls from "../../../constants/apiUrls.json";
import { getApiHeaders } from "../../../constants/apiHeaders";
import { parseClassModules } from '../../../utils/parse/liveClass/parseClassModules';
import { ClassModule } from '../../../types';

export async function getClassModules(
    context: vscode.ExtensionContext, 
    courseId: string
): Promise<ClassModule[]> {

    const url = apiUrls.baseUrl + 
                apiUrls.getClassModules
                    .replace("{{courseId}}", courseId);

    return await fetch(url, {
        "headers": await getApiHeaders(context),
        "body": null,
        "method": "GET"
      }).then(async(response) => await parseClassModules(response))
      .catch(error => {
        vscode.window.showErrorMessage(`Error getting class modules: ${error}`);
        throw new Error(`Error getting class modules: ${error}`);
      });

}

