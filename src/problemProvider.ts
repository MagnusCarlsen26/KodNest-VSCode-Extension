import * as vscode from 'vscode';
import { Problem } from './types';

export class ProblemProvider implements vscode.TreeDataProvider<Problem> {
    
    private onDidChangeTreeDataEmitter: vscode.EventEmitter<Problem | undefined | void> =
        new vscode.EventEmitter<Problem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<Problem | undefined | void> =
        this.onDidChangeTreeDataEmitter.event;

    private problems: Problem[] = [
        { id: 'KN-001', title: 'Two Sum', difficulty: 'Easy' },
        { id: 'KN-002', title: 'Reverse Linked List', difficulty: 'Medium' },
        { id: 'KN-003', title: 'LRU Cache', difficulty: 'Hard' }
    ];

    refresh(): void {
        this.onDidChangeTreeDataEmitter.fire();
    }

    getTreeItem(problem: Problem): vscode.TreeItem {
        const item = new vscode.TreeItem(problem.title, vscode.TreeItemCollapsibleState.None);
        item.description = `${problem.difficulty}`;
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
