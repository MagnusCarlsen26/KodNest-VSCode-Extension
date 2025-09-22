import { ProblemMeta } from "../types";
import { parseProblemFromActiveEditor } from "../utils/problemDescriptionPanel/parseProblemFromEditor";
import { ProblemDescriptionPanel } from "../ui/descriptionPanel";
import * as vscode from 'vscode';

export function showDescription(
    docOrProblem: unknown,
    context: vscode.ExtensionContext,
) {

    let problem: ProblemMeta | undefined;
    const asAny = docOrProblem as any;

    if (asAny?.id && asAny?.title) {
      problem = asAny as ProblemMeta;
    } else {
      problem = parseProblemFromActiveEditor();
    }

    if (!problem) {
      vscode.window.showErrorMessage('No problem context found to show description for.');
      return;
    }

    ProblemDescriptionPanel.createOrShow(context.extensionUri, problem);

}