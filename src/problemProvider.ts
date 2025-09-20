import * as vscode from 'vscode';
import { Problem } from './types';

export class ProblemProvider implements vscode.TreeDataProvider<Problem> {
    
    private onDidChangeTreeDataEmitter: vscode.EventEmitter<Problem | undefined | void> =
        new vscode.EventEmitter<Problem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<Problem | undefined | void> =
        this.onDidChangeTreeDataEmitter.event;

    private problems: Problem[] = [];

    constructor() { /* Problems will be loaded asynchronously */ }

    async loadProblems(extensionPath: string): Promise<void> {
        const fs = await import('fs');
        const path = await import('path');
        const problemsPath = path.join(extensionPath, 'database', 'allQuestionDescriptions.json');
        const rawData = fs.readFileSync(problemsPath, 'utf-8');
        const jsonData = JSON.parse(rawData);

        this.problems = jsonData.flatMap((moduleData: any) => {
            const problemsForModule: Problem[] = [];
            for (const sectionId in moduleData.sections) {
                const section = moduleData.sections[sectionId];
                for (const problemId in section) {
                    const item = section[problemId];
                    const p = {
                        id: item.id,
                        title: item.title,
                        difficulty: (item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)) as 'Easy' | 'Medium' | 'Hard',
                        status: item.status,
                        topic: item.tags && item.tags.length > 0 ? item.tags[0] : undefined,
                        sectionId: sectionId,
                        moduleName: moduleData.module.name,
                        moduleDescription: moduleData.module.description,
                        moduleDifficulty: moduleData.module.difficulty,
                        moduleCategoryTitle: moduleData.module.category.title,
                        content_markdown: item.description,
                    } as unknown as Problem;
                    problemsForModule.push(p);
                }
            }
            return problemsForModule;
        });
        this.refresh();
    }

    refresh(): void {
        this.onDidChangeTreeDataEmitter.fire();
    }

    getTreeItem(problem: Problem): vscode.TreeItem {
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

    getChildren(): Problem[] {
        return this.problems;
    }
}
