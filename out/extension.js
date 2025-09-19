"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const problemProvider_1 = require("./problemProvider");
const codeLensProvider_1 = require("./codeLensProvider");
const descriptionPanel_1 = require("./descriptionPanel");
const problemService_1 = require("./services/problemService");
function activate(context) {
    const problemProvider = new problemProvider_1.ProblemProvider();
    vscode.window.registerTreeDataProvider('kodnestProblems', problemProvider);
    (0, problemService_1.registerCommand)(context, problemService_1.COMMAND.REFRESH_PROBLEMS, () => {
        problemProvider.refresh();
    });
    (0, problemService_1.registerCommand)(context, problemService_1.COMMAND.OPEN_PROBLEM, (problemLike) => {
        const meta = (0, problemService_1.normalizeToProblemMeta)(problemLike);
        descriptionPanel_1.ProblemDescriptionPanel.createOrShow(context.extensionUri, meta);
    });
    const codeLensProvider = new codeLensProvider_1.KodnestCodeLensProvider();
    context.subscriptions.push(vscode.languages.registerCodeLensProvider({ scheme: 'file', language: 'javascript' }, codeLensProvider));
    (0, problemService_1.registerCommand)(context, problemService_1.COMMAND.SHOW_DESCRIPTION, (docOrProblem) => {
        let problem;
        const asAny = docOrProblem;
        if (asAny?.id && asAny?.title) {
            problem = asAny;
        }
        else {
            problem = (0, problemService_1.parseProblemFromActiveEditor)();
        }
        if (!problem) {
            vscode.window.showErrorMessage('No problem context found to show description for.');
            return;
        }
        descriptionPanel_1.ProblemDescriptionPanel.createOrShow(context.extensionUri, problem);
    });
    (0, problemService_1.registerCommand)(context, problemService_1.COMMAND.RUN, async (payload) => {
        const maybePayload = payload;
        if (maybePayload && typeof maybePayload === 'object' && 'problem' in maybePayload && maybePayload.problem) {
            const idx = Number(maybePayload.sampleIndex ?? 0);
            vscode.window.showInformationMessage(`Run sample ${idx + 1} for ${maybePayload.problem.id}`);
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Open a problem file to run.');
            return;
        }
        vscode.window.showInformationMessage(`Running ${editor.document.fileName} (no sample).`);
    });
    (0, problemService_1.registerCommand)(context, problemService_1.COMMAND.SUBMIT, (doc) => {
        vscode.window.showInformationMessage(`Submitting ${doc.fileName}...`);
    });
    (0, problemService_1.registerCommand)(context, problemService_1.COMMAND.CREATE_EDITOR, async (problem) => {
        if (!problem) {
            vscode.window.showErrorMessage('No problem data provided to create editor.');
            return;
        }
        await (0, problemService_1.createEditorForProblem)(context, problem);
    });
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map