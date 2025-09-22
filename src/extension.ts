import * as vscode from 'vscode';

import { COMMAND, registerCommand } from './utils/commands';
import { ProblemProvider } from './problemProvider';
import { KodnestCodeLensProvider } from './codeLensProvider';
import { ProblemMeta } from './types';
import { ProblemsWebviewProvider } from './ui/problemsWebview';

import { askAuthTokenAndStore } from './services/auth/askAuthTokenAndStore';
import { askUserIdAndStore } from './services/auth/askUserId';
import { getAuthToken } from './services/auth/getAuthToken';
import { getUserId } from './services/auth/getUserId';
import { downloadDb } from './services/db/downloadDb';

import { openProblem } from './commands/openProblem';
import { showDescription } from './commands/showDescription';
import { createEditorForProblem } from './commands/createEditorForProblem';
import { getAllTokens } from './commands/getAllTokens';
import { testSolution } from './commands/testSolution';


export async function activate(context: vscode.ExtensionContext) {

  await downloadDb(context);
  await getAllTokens(context);


  const problemProvider = new ProblemProvider();

  // Register sidebar Webview View instead of TreeDataProvider
  const webviewProvider = new ProblemsWebviewProvider(context.extensionUri, problemProvider);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ProblemsWebviewProvider.viewId, webviewProvider)
  );

  // Load problems, then refresh the webview with data
  await problemProvider.loadProblems(context.extensionPath);
  webviewProvider.refresh();

  // Refresh webview when underlying problems change
  context.subscriptions.push(
    problemProvider.onDidChangeTreeData(() => webviewProvider.refresh())
  );

  registerCommand(context, COMMAND.REFRESH_PROBLEMS, () => {
    problemProvider.refresh();
    webviewProvider.refresh();
  });

  registerCommand(context, COMMAND.SET_AUTH_TOKEN,() => askAuthTokenAndStore(context));
  registerCommand(context, COMMAND.GET_AUTH_TOKEN, () => getAuthToken(context));
  registerCommand(context, COMMAND.SET_USER_ID, () => askUserIdAndStore(context));
  registerCommand(context, COMMAND.GET_USER_ID, () => getUserId(context));

  registerCommand(context, COMMAND.OPEN_PROBLEM, (problemLike: unknown) => openProblem(problemLike,context, problemProvider));
  registerCommand(context, COMMAND.CREATE_EDITOR, (problem: ProblemMeta) => createEditorForProblem(context, problem));
  registerCommand(context, COMMAND.SHOW_DESCRIPTION, (docOrProblem: unknown) => showDescription(docOrProblem, context));

  registerCommand(context, COMMAND.RUN, () => testSolution(context));
  // todo: later change this function name
  registerCommand(context, COMMAND.SUBMIT, () => testSolution(context));
  
  const codeLensProvider = new KodnestCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: 'file', language: 'javascript' }, codeLensProvider)
  );
}

export function deactivate() {}