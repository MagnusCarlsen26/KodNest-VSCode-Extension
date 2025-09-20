import * as vscode from 'vscode';
import { Problem, Module } from './types';

export class ProblemProvider implements vscode.TreeDataProvider<Problem | Module> {
    
    private onDidChangeTreeDataEmitter: vscode.EventEmitter<Problem | undefined | void> =
        new vscode.EventEmitter<Problem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<Problem | undefined | void> =
        this.onDidChangeTreeDataEmitter.event;

    private modules: Module[] = [];

    constructor() { /* Problems will be loaded asynchronously */ }

    async loadProblems(extensionPath: string): Promise<void> {
        const fs = await import('fs');
        const path = await import('path');
        const problemsPath = path.join(extensionPath, 'database', 'allQuestionDescriptions.json');
        const rawData = fs.readFileSync(problemsPath, 'utf-8');
        const jsonData = JSON.parse(rawData);

        this.modules = jsonData.map((moduleData: any) => {
            const problemsForModule: Problem[] = [];
            for (const sectionId in moduleData.sections) {
                const section = moduleData.sections[sectionId];
                for (const problemId in section) {
                    const item = section[problemId];
                    // Extract samples from test_cases
                    const samples = Array.isArray(item.test_cases)
                        ? item.test_cases
                            .filter((testCase: any) => testCase.sample === true)
                            .map((testCase: any) => ({
                                input: testCase.input,
                                output: testCase.output
                            }))
                        : [];

                    const p = {
                        id: item.id,
                        title: item.title || `Problem ${item.id}`,
                        difficulty: (item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)) as 'Easy' | 'Medium' | 'Hard',
                        status: item.status,
                        topic: item.tags && item.tags.length > 0 ? item.tags[0] : undefined,
                        sectionId: sectionId,
                        moduleName: moduleData.module.name,
                        moduleDescription: moduleData.module.description,
                        moduleDifficulty: moduleData.module.difficulty,
                        moduleCategoryTitle: moduleData.module.category.title,
                        content_markdown: item.description,
                        samples: samples
                    } as unknown as Problem;

                    problemsForModule.push(p);
                }
            }

            const module: Module = {
                id: moduleData.module.id,
                name: moduleData.module.name,
                description: moduleData.module.description,
                difficulty: moduleData.module.difficulty,
                progress: moduleData.module.progress || 0,
                noOfQuestions: moduleData.module.no_of_questions,
                categoryTitle: moduleData.module.category.title,
                problems: problemsForModule
            };

            return module;
        });
        this.refresh();
    }

    refresh(): void {
        this.onDidChangeTreeDataEmitter.fire();
    }

    getTreeItem(element: Problem | Module): vscode.TreeItem {
        if ('problems' in element) {
            // This is a Module
            const module = element as Module;
            const item = new vscode.TreeItem(module.name, vscode.TreeItemCollapsibleState.Collapsed);

            const totalProblems = module.problems.length;
            const solvedProblems = module.problems.filter(p => p.status === 'solved').length;
            const progress = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

            // Color the module name based on difficulty
            const getDifficultyColor = (difficulty: string): string => {
              switch (difficulty.toUpperCase()) {
                case 'EASY':
                case 'BEGINNER':
                  return '$(check) '; // Green checkmark
                case 'MEDIUM':
                case 'INTERMEDIATE':
                  return '$(warning) '; // Yellow warning
                case 'HARD':
                case 'ADVANCED':
                  return '$(error) '; // Red error
                default:
                  return '$(folder) '; // Default folder icon
              }
            };

            item.label = getDifficultyColor(module.difficulty) + module.name;
            item.description = `${solvedProblems}/${totalProblems} solved (${progress}%)`;
            item.tooltip = `${module.difficulty} | ${module.description}`;
            item.iconPath = new vscode.ThemeIcon('folder');

            return item;
        } else {
            // This is a Problem
            const problem = element as Problem;
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

            // Set icon based on status
            if (problem.status === 'solved') {
                item.iconPath = new vscode.ThemeIcon('check');
            } else {
                item.iconPath = new vscode.ThemeIcon('question');
            }

            return item;
        }
    }

    getChildren(element?: Problem | Module): Problem[] | Module[] {
        if (!element) {
            // Root level - return modules
            return this.modules;
        } else if ('problems' in element) {
            // Module level - return problems
            return (element as Module).problems;
        } else {
            // Problem level - no children
            return [];
        }
    }

    /**
     * Find a problem by ID across all modules
     */
    findProblemById(id: string): Problem | undefined {
        for (const module of this.modules) {
            const problem = module.problems.find(p => p.id === id);
            if (problem) {
                return problem;
            }
        }
        return undefined;
    }
}
