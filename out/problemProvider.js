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
exports.ProblemProvider = void 0;
const vscode = __importStar(require("vscode"));
class ProblemProvider {
    onDidChangeTreeDataEmitter = new vscode.EventEmitter();
    onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
    problems = [];
    constructor() { }
    async loadProblems(extensionPath) {
        const fs = await import('fs');
        const path = await import('path');
        const problemsPath = path.join(extensionPath, 'database', 'allQuestionDescriptions.json');
        const rawData = fs.readFileSync(problemsPath, 'utf-8');
        const jsonData = JSON.parse(rawData);
        this.problems = jsonData.flatMap((moduleData) => {
            const problemsForModule = [];
            for (const sectionId in moduleData.sections) {
                const section = moduleData.sections[sectionId];
                for (const problemId in section) {
                    const item = section[problemId];
                    problemsForModule.push({
                        id: item.id,
                        title: item.title,
                        difficulty: item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1),
                        status: item.status,
                        topic: item.tags && item.tags.length > 0 ? item.tags[0] : undefined, // Assuming topic is the first tag
                        sectionId: sectionId,
                        moduleName: moduleData.module.name,
                        moduleDescription: moduleData.module.description,
                        moduleDifficulty: moduleData.module.difficulty,
                        moduleCategoryTitle: moduleData.module.category.title,
                        content_markdown: item.description,
                    });
                }
            }
            return problemsForModule;
        });
        this.refresh();
    }
    refresh() {
        this.onDidChangeTreeDataEmitter.fire();
    }
    getTreeItem(problem) {
        const item = new vscode.TreeItem(problem.title, vscode.TreeItemCollapsibleState.None);
        let descriptionParts = [];
        if (problem.difficulty) {
            descriptionParts.push(problem.difficulty);
        }
        if (problem.status) {
            descriptionParts.push(problem.status);
        }
        item.description = descriptionParts.join(' | ');
        item.command = {
            command: 'kodnest.openProblem',
            title: 'Open Problem',
            arguments: [problem]
        };
        return item;
    }
    getChildren() {
        return this.problems;
    }
}
exports.ProblemProvider = ProblemProvider;
//# sourceMappingURL=problemProvider.js.map