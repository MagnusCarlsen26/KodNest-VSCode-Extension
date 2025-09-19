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
exports.normalizeToProblemMeta = normalizeToProblemMeta;
exports.parseProblemFromActiveEditor = parseProblemFromActiveEditor;
exports.createEditorForProblem = createEditorForProblem;
const vscode = __importStar(require("vscode"));
function normalizeToProblemMeta(input) {
    const asAny = input;
    const id = asAny?.id ?? asAny?.fileId ?? 'unknown-id';
    const title = asAny?.title ?? asAny?.label ?? 'Untitled Problem';
    const difficulty = asAny?.difficulty ?? 'Unknown';
    const content_markdown = asAny?.content_markdown ?? `# ${title}\n\n(Description not loaded during dev)`;
    const samples = Array.isArray(asAny?.samples) ? asAny.samples : [];
    return { id, title, difficulty, content_markdown, samples };
}
function parseProblemFromActiveEditor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return undefined;
    }
    const firstLine = editor.document.lineAt(0).text;
    const match = firstLine.match(/\/\/\s*(.+)\s*\(([^)]+)\)/);
    if (match) {
        return { id: match[2], title: match[1], content_markdown: `# ${match[1]}\n\n(Description not loaded during dev)` };
    }
    return { id: 'unknown', title: editor.document.fileName, content_markdown: '(Description not available)' };
}
async function createEditorForProblem(context, problem) {
    const docContent = `// ${problem.title} (${problem.difficulty || 'Unknown'})\n// Problem ID: ${problem.id}\n// Write your solution here\n\nfunction solution() {\n  // TODO: implement\n}\n\n`;
    const untitled = vscode.Uri.parse(`untitled:${problem.id}.js`);
    try {
        const doc = await vscode.workspace.openTextDocument(untitled);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(untitled, new vscode.Position(0, 0), docContent);
        await vscode.workspace.applyEdit(edit);
        await vscode.window.showTextDocument(doc);
        return;
    }
    catch (err) {
        // fall through to workspace file creation
    }
    try {
        const newUri = vscode.Uri.joinPath(context.extensionUri, `${problem.id}.js`);
        await vscode.workspace.fs.writeFile(newUri, Buffer.from(docContent, 'utf8'));
        const doc2 = await vscode.workspace.openTextDocument(newUri);
        await vscode.window.showTextDocument(doc2);
    }
    catch {
        vscode.window.showErrorMessage('Failed to create editor for problem.');
    }
}
//# sourceMappingURL=problem.js.map