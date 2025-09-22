import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { Score } from '../../utils/parse/parseScores';

function normalizeScoreStatus(status: string | undefined): string | undefined {

    if (!status) { return status; }
    
    const s = status.toLowerCase().trim();
    if (s === 'accepted' || s === 'completed' || s === 'solved' || s === 'done' || s === 'passed' || s === 'pass') {
        return 'solved';
    }
    if (s === 'wrong answer' || s === 'wa' || s === 'failed' || s === 'fail') {
        return 'wrong_answer';
    }
    if (s.includes('error')) {
        return 'error';
    }
    if (s === 'pending' || s === 'in_progress' || s === 'running' || s === 'queued') {
        return 'pending';
    }
    return status;
}

export async function updateScoresInDb(
    context: vscode.ExtensionContext,
    moduleId: string,
    scores: Score[]
): Promise<{ updated: number }> {
    const dbPath = path.join(context.extensionPath, 'database', 'allQuestionDescriptions.json');
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const data = JSON.parse(raw);

    const byProblemId: Map<string, string> = new Map();
    for (const score of scores) {
        byProblemId.set(score.problemId, normalizeScoreStatus(score.status) || score.status);
    }

    let updated = 0;
    for (const moduleData of data) {
        if (!moduleData?.module || moduleData.module.id !== moduleId) { continue; }
        const sections = moduleData.sections || {};
        for (const sectionId of Object.keys(sections)) {
            const section = sections[sectionId] || {};
            for (const problemId of Object.keys(section)) {
                const item = section[problemId];
                const pid = item?.id || problemId;
                const newStatus = byProblemId.get(pid);
                if (newStatus && item && item.status !== newStatus) {
                    item.status = newStatus;
                    updated += 1;
                }
            }
        }
    }

    if (updated > 0) {
        fs.writeFileSync(dbPath, JSON.stringify(data));
    }

    return { updated };
}


