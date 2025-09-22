import { ProblemDescriptionPanel } from "../ui/descriptionPanel";
import { ProblemMeta } from "../types";
import { normalizeToProblemMeta } from "../utils/problemDescriptionPanel/normalizeToProblemMeta";
import { ProblemProvider } from "../problemProvider";
import * as vscode from 'vscode';

export function openProblem(
    problemLike: unknown,
    context: vscode.ExtensionContext,
    problemProvider: ProblemProvider,
) {
    let meta: ProblemMeta;

    if (typeof problemLike === 'string') {
      const problem = problemProvider.findProblemById(problemLike);

      if (problem) {
        meta = {
          id: problem.id,
          title: problem.title,
          difficulty: problem.difficulty,
          content_markdown: problem.content_markdown || `# ${problem.title}\n\n(No description available)`,
          samples: problem.samples || [],
          sectionId: problem.sectionId,
          moduleId: problem.moduleId,
          status: problem.status,
          topic: problem.topic,
          moduleName: problem.moduleName,
          moduleDescription: problem.moduleDescription,
          moduleDifficulty: problem.moduleDifficulty,
          moduleCategoryTitle: problem.moduleCategoryTitle,
          languages: problem.languages // Include the languages property
        };
      } else {
        // Fallback to creating a basic meta from the ID
        meta = normalizeToProblemMeta({ id: problemLike });
      }
    } else {
      // Use the existing normalization logic for other types
      meta = normalizeToProblemMeta(problemLike);
    }
    ProblemDescriptionPanel.createOrShow(context.extensionUri, meta);
    try {
      context.workspaceState.update('kodnest.lastProblemMeta', meta);
    } catch {
        vscode.window.showErrorMessage('Failed to update workspace state with problem meta.');
    }
}