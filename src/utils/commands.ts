import * as vscode from 'vscode';

export const COMMAND = {
  REFRESH_PROBLEMS: 'kodnest.refreshProblems',
  OPEN_PROBLEM: 'kodnest.openProblem',
  SHOW_DESCRIPTION: 'kodnest.showDescription',
  RUN: 'kodnest.run',
  SUBMIT: 'kodnest.submit',
  CREATE_EDITOR: 'kodnest.createEditor'
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


