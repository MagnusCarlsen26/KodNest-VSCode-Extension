import * as vscode from 'vscode';

export interface Problem {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export class ProblemProvider implements vscode.TreeDataProvider<Problem> {
    
    private _onDidChangeTreeData: vscode.EventEmitter<Problem | undefined | void> =
        new vscode.EventEmitter<Problem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<Problem | undefined | void> =
        this._onDidChangeTreeData.event;

    private problems: Problem[] = [
        { id: 'KN-001', title: 'Two Sum', difficulty: 'Easy' },
        { id: 'KN-002', title: 'Reverse Linked List', difficulty: 'Medium' },
        { id: 'KN-003', title: 'LRU Cache', difficulty: 'Hard' }
    ];

    refresh(): void {
        this._onDidChangeTreeData.fire();
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
