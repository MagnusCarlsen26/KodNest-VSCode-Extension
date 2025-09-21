import * as vscode from 'vscode';
import apiUrls from '../../constants/apiUrls.json';
import { getApiHeaders } from '../../constants/apiHeaders';
import { parseSubmissionByExecutionIdResponse } from '../../utils/parse/parseSubmissionByExecutionIdResponse';
import { Verdict } from '../../types';


export async function getSubmissionByExecutionId(
    context: vscode.ExtensionContext,
    executionId: string,
): Promise<Verdict[]> {

    const url = apiUrls.baseUrl + 
                apiUrls.getSubmissionByExecutionId
                    .replace("{{executionId}}", executionId);

    return retryApiCall(async () => {
        return fetch(url, {
            "headers": await getApiHeaders(context),
            "body": null,
            "method": "GET"
        }).then(async(response) => await parseSubmissionByExecutionIdResponse(response))
        .catch(error => {
            vscode.window.showErrorMessage(`Error getting submission by execution id: ${error}`);
            throw new Error(`Error getting submission by execution id: ${error}`);
        });
    });
}

export async function retryApiCall<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 10000 // milliseconds
): Promise<T> {

    console.log("Retrying API call. Retries left:", delay);
    
    try {
        await new Promise(res => setTimeout(res, delay));
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            console.log('Error getting submission by execution id',error)
            console.warn(`Retrying API call. ${retries - 1} retries left.`);
            return retryApiCall(fn, retries - 1, delay);
        }
        throw error;
    }
}
