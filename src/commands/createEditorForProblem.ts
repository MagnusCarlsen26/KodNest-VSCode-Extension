import * as vscode from 'vscode';
import { ProblemMeta } from '../types';
import { getFileExtension } from '../utils/problemDescriptionPanel/getFileExtension';
import { sanitizeFilename } from '../utils/problemDescriptionPanel/sanitizeFileName';

export async function createEditorForProblem(
    context: vscode.ExtensionContext,
    problem: ProblemMeta,
): Promise<void> {

    try {
        const boilerplate = problem.languages?.[0]?.boilerplate;

        if (!boilerplate) {
            vscode.window.showErrorMessage(`No boilerplate code available for problem: ${problem.title}`);
            return;
        }

        let {solutionsDir, fileUri} = await getStorageUri(context, problem);

        // Ensure the directory exists
        await vscode.workspace.fs.createDirectory(solutionsDir);

        try {
            // If file exists, open it
            await vscode.workspace.fs.stat(fileUri);
            await openFile(fileUri);
        } catch (e) {
            // File does not exist, create it with boilerplate
            await createFileWithBoilerplate(fileUri, boilerplate);
        }
    } catch (err) {
        vscode.window.showErrorMessage(`Failed to create editor for problem: ${err}`);
    }
}

async function openFile(
    fileUri: vscode.Uri,
) {
    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.One });
    vscode.window.showInformationMessage(`Opened existing file: ${fileUri.fsPath}`);
}

async function createFileWithBoilerplate(
    fileUri: vscode.Uri,
    boilerplate: string,
) {

    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(boilerplate, 'utf8'));

    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document, { 
        preview: false, 
        viewColumn: vscode.ViewColumn.One 
    });
    
}

async function getStorageUri(
    context: vscode.ExtensionContext,
    problem: ProblemMeta,
): Promise<{ solutionsDir: vscode.Uri, fileUri: vscode.Uri }> {

    const language = problem.languages?.[0]?.name;
    const fileExtension = getFileExtension(language || 'unknown');
    const sanitizedTitle = sanitizeFilename(problem.title);
    const fileName = `${sanitizedTitle}${fileExtension}`;

    // Determine the path within the extension's storage
    let baseStorageUri: vscode.Uri | undefined = context.storageUri ?? context.globalStorageUri;

    if (!baseStorageUri) {
        vscode.window.showErrorMessage('Neither workspace nor global storage is available.');
        throw new Error('Neither workspace nor global storage is available.');
    }

    const solutionsDir = vscode.Uri.joinPath(baseStorageUri, 'solutions');
    const fileUri = vscode.Uri.joinPath(solutionsDir, fileName);

    return { solutionsDir, fileUri };
}