import * as vscode from 'vscode';
import { parseProblemFromActiveEditor } from '../../utils/problem';
import { ProblemMeta } from '../../types';
import apiUrls from '../../constants/apiUrls.json';
import { getApiHeaders } from '../../constants/apiHeaders';
import { convertToBase64 } from '../../utils/convertToFromBase64';
import { getUserId } from '../auth/getUserId';
import { getSubmissionByExecutionId } from './getSubmissionByExecutionId';
import { VerdictPanel } from '../../verdictPanel';
import { getQuestionContextById } from '../../utils/lookup';
import { getSubmissions } from './getSubmissions';


export async function testSolution(context: vscode.ExtensionContext): Promise<void> {

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('Open a problem file to run.');
      return;
    }

    const activeProblem = parseProblemFromActiveEditor();
    if (!activeProblem) {
        vscode.window.showErrorMessage('Could not determine problem details from the active editor.');
        return;
    }
    const activeCode = editor.document.getText();
    const activeName = activeProblem ? activeProblem.title : editor.document.fileName;

    vscode.window.showInformationMessage(`Run clicked for ${activeName}`);

    // Merge with stored meta and DB lookup to avoid undefined IDs
    const storedMeta = context.workspaceState.get<any>('kodnest.lastProblemMeta');
    const merged: any = { ...activeProblem, ...storedMeta };
    if ((!merged.moduleId || !merged.sectionId) && vscode.extensions.getExtension('') === undefined) {
      // no-op, placeholder to satisfy types in some editors
    }
    if (!merged.moduleId || !merged.sectionId) {
      try {
        const extUri = context.extensionUri;
        const ctx = await getQuestionContextById(extUri.fsPath, activeProblem.id);
        if (ctx) {
          merged.moduleId = merged.moduleId || ctx.moduleId;
          merged.sectionId = merged.sectionId || ctx.sectionId;
        }
      } catch {}
    }

    await sendTestSolution(context, merged, activeCode);

}



async function sendTestSolution(
    context: vscode.ExtensionContext,
    activeProblem: ProblemMeta,
    activeCode: string
): Promise<void> {

    vscode.window.showInformationMessage(`Sending solution for ${activeProblem.title}`);

    const moduleId = (activeProblem as any).moduleId;
    const sectionId = activeProblem.sectionId;
    const questionId = activeProblem.id;



    const url = apiUrls.baseUrl + 
                apiUrls.submitSolution
                    .replace("{{moduleId}}", moduleId);
                    
    // Log dynamic request details
    const userId = await getUserId(context);
    const languageId = activeProblem.languages?.[0]?.id || 62;
    const languageName = activeProblem.languages?.[0]?.name || "Java (OpenJDK 13.0.1)";
    const requestBody = {
        user_id: userId,
        section_id: sectionId,
        type: "programming",
        response: {
            source_code: convertToBase64(activeCode),
            language_id: languageId
        },
        question_id: questionId,
        time_taken: 0,
        language: {
            id: languageId,
            name: languageName
        }
    };

    checkForIds(moduleId, sectionId, questionId);

    await fetch(url, {
        "headers": await getApiHeaders(context),
        "body": JSON.stringify(requestBody),
        "method": "POST"
    }).then(async () => {
        vscode.window.showInformationMessage(`Test solution sent successfully`);
    }).catch(error => {
        vscode.window.showErrorMessage(`Error sending test solution: ${error}`);
        console.error("Error sending test solution:", error);
        throw new Error(`Error sending test solution: ${error}`);
    });

    const submissionIds = await getSubmissions(context, activeProblem.id, moduleId);
    const verdicts = await getSubmissionByExecutionId(context, submissionIds[0]);

    // Open verdict panel on the right. If no split, create it and preserve left editor.
    await VerdictPanel.showOnRight(context.extensionUri, verdicts);

}

function checkForIds(
    moduleId: string, 
    sectionId: string | undefined, 
    questionId: string
) {

    if (!moduleId) {
        vscode.window.showErrorMessage('Module ID is missing. Please open the problem from the sidebar so metadata loads.');
        throw new Error('Missing moduleId');
    }
    if (!sectionId) {
        vscode.window.showErrorMessage('Section ID is missing.');
        throw new Error('Missing sectionId');
    }
    if (!questionId) {
        vscode.window.showErrorMessage('Question ID is missing.');
        throw new Error('Missing questionId');
    }

}