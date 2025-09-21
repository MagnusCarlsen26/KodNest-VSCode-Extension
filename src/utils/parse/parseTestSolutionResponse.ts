import * as vscode from 'vscode';

export function parseTestSolutionResponse(
    response: any
): string[] {

    if (response.message !== "success") {
        vscode.window.showErrorMessage(`Error sending test solution: ${response.message}`);
        throw new Error(response.message);
    }

    return response.data.map((execution: any) => execution.execution_id);
}