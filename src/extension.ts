import * as vscode from 'vscode';
import { ProblemProvider } from './problemProvider';
import { KodnestCodeLensProvider } from './codeLensProvider';
import { ProblemDescriptionPanel } from './descriptionPanel';
import { ProblemMeta, Verdict } from './types';
import { COMMAND, registerCommand } from './utils/commands';
import { normalizeToProblemMeta, parseProblemFromActiveEditor, createEditorForProblem } from './utils/problem';
import { ProblemsWebviewProvider } from './problemsWebview';
import { askAuthTokenAndStore } from './services/auth/askAuthTokenAndStore';
import { askUserIdAndStore } from './services/auth/askUserId';
import { testSolution } from './services/api/testSolution';
import { VerdictPanel } from './verdictPanel';


export async function activate(context: vscode.ExtensionContext) {
  const problemProvider = new ProblemProvider();

  // Check if auth token exists, if not, prompt the user
  if (!(await context.secrets.get('kodnestAuthToken'))) {
    await askAuthTokenAndStore(context);
  }

  // Check if user ID exists, if not, prompt the user
  if (!(await context.secrets.get('kodnestUserId'))) {
    await askUserIdAndStore(context);
  }

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

  // Command to ask for and securely store the KodNest Auth Token
  registerCommand(context, COMMAND.SET_AUTH_TOKEN, async () => {
    await askAuthTokenAndStore(context);
  });

  // Command to ask for and securely store the KodNest User ID
  registerCommand(context, COMMAND.SET_USER_ID, async () => {
    await askUserIdAndStore(context);
  });

  // Command to retrieve and display the stored KodNest Auth Token (for testing/debug)
  registerCommand(context, COMMAND.GET_AUTH_TOKEN, async () => {
    const token = await context.secrets.get('kodnestAuthToken');
    if (token) {
      vscode.window.showInformationMessage(`Stored KodNest token: ${token}`);
    } else {
      vscode.window.showInformationMessage('No KodNest authentication token found.');
    }
  });

  // Command to retrieve and display the stored KodNest User ID (for testing/debug)
  registerCommand(context, COMMAND.GET_USER_ID, async () => {
    const userId = await context.secrets.get('kodnestUserId');
    if (userId) {
      vscode.window.showInformationMessage(`Stored KodNest User ID: ${userId}`);
    } else {
      vscode.window.showInformationMessage('No KodNest user ID found.');
    } 
  });

  registerCommand(context, COMMAND.OPEN_PROBLEM, (problemLike: unknown) => {
    let meta: ProblemMeta;

    // If it's just a string (ID), look up the full problem data
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
    } catch {}
  });

  const codeLensProvider = new KodnestCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: 'file', language: 'javascript' }, codeLensProvider)
  );

  registerCommand(context, COMMAND.SHOW_DESCRIPTION, (docOrProblem: unknown) => {
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
  });

  registerCommand(context, COMMAND.RUN, async () => {
    return await testSolution(context);
  });

  // SUBMIT command - shows notifications, supports being called with a TextDocument or fallback to active editor
  registerCommand(context, COMMAND.SUBMIT, async () => {
    // todo: later change this function name
    return await testSolution(context);
  });

  // Temporary: Show Verdict panel with mock data for UI testing
  registerCommand(context, COMMAND.SHOW_MOCK_VERDICT, async () => {
    const mockVerdicts: Verdict[] = [
      {
        expectedOutput: '[0, 1]\n',
        compileOutput: '',
        status: 'Wrong Answer',
        stdin: '1\n',
        stdout: '[]\n',
        stderr: '',
        time: '116'
      },
      {
        expectedOutput: '[0, 1, 1, 2, 1, 2, 2, 3, 1]\n',
        compileOutput: '',
        status: 'Wrong Answer',
        stdin: '8\n',
        stdout: '[]\n',
        stderr: '',
        time: '110'
      },
      {
        expectedOutput: '[0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2]\n',
        compileOutput: '',
        status: 'Wrong Answer',
        stdin: '10\n',
        stdout: '[]\n',
        stderr: '',
        time: '117'
      },
      {
        expectedOutput: '[0]\n',
        compileOutput: '',
        status: 'Wrong Answer',
        stdin: '0\n',
        stdout: '[]\n',
        stderr: '',
        time: '131'
      }
    ];
    VerdictPanel.createOrShow(context.extensionUri, mockVerdicts);
  });

  // CREATE_EDITOR command - create an editor for the provided ProblemMeta
  registerCommand(context, COMMAND.CREATE_EDITOR, async (problem: ProblemMeta) => {
    if (!problem) {
      vscode.window.showErrorMessage('No problem data provided to create editor.');
      return;
    }
    try {
      await createEditorForProblem(context, problem);
      vscode.window.showInformationMessage(`Opened editor for "${problem.title ?? problem.id}".`);
    } catch (err) {
      vscode.window.showErrorMessage('Failed to create editor: ' + String(err));
    }
  });
}

export function deactivate() {}