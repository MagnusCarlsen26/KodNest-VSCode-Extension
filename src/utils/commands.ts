import * as vscode from 'vscode';

export const COMMAND = {
  REFRESH_PROBLEMS: 'kodnest.refreshProblems',
  OPEN_PROBLEM: 'kodnest.openProblem',
  SHOW_DESCRIPTION: 'kodnest.showDescription',
  RUN: 'kodnest.run',
  SUBMIT: 'kodnest.submit',
  CREATE_EDITOR: 'kodnest.createEditor',
  SET_AUTH_TOKEN: 'kodnest.setAuthToken',
  GET_AUTH_TOKEN: 'kodnest.getAuthToken',
  SET_USER_ID: 'kodnest.setUserId',
  GET_USER_ID: 'kodnest.getUserId',
  SHOW_MOCK_VERDICT: 'kodnest.showMockVerdict'
} as const;

export type Values<T> = T[keyof T];
export type CommandId = Values<typeof COMMAND>;

export function registerCommand(
  context: vscode.ExtensionContext,
  id: CommandId,
  callback: (...args: any[]) => any
) {
  const disposable = vscode.commands.registerCommand(id, callback);
  context.subscriptions.push(disposable);
}


