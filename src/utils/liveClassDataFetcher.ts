import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import { getClassInfo } from '../services/api/liveClass/getClassInfo';
import { getClassModules } from '../services/api/liveClass/getClassModules';
import { getClassTopics } from '../services/api/liveClass/getClassTopics';
import { getClassSubTopics } from '../services/api/liveClass/getClassSubTopics';
import { getClassNotes } from '../services/api/liveClass/getClassNotes';
import { ClassInfo, ClassModule, ClassTopic, ClassSubtopic, ClassNotes } from '../types';

// Helper function to process promises in batches with concurrency control
async function processInBatches<T>(
    promises: Promise<T>[],
    batchSize: number = 10,
    onProgress?: (completed: number, total: number) => void
): Promise<(PromiseSettledResult<T>)[]> {
    const results: PromiseSettledResult<T>[] = [];
    const total = promises.length;

    for (let i = 0; i < total; i += batchSize) {
        const batch = promises.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch);
        results.push(...batchResults);

        if (onProgress) {
            onProgress(Math.min(i + batchSize, total), total);
        }
    }

    return results;
}

export async function fetchLiveClassData(context: vscode.ExtensionContext, courseId: string): Promise<{
    liveClasses: ClassInfo[];
    modules: any[];
    topics: any[];
    subTopics: any[];
    notes: any[];
} | null> {
    try {
        const liveClasses = await getClassInfo(context, courseId);

        if (!liveClasses || liveClasses.length === 0) {
            // vscode.window.showInformationMessage('No live classes found.');
            return null;
        }

        console.log('liveClasses', liveClasses);

        // Create a nested data structure
        const nestedData: any[] = [];
        const errors: string[] = [];

        // Process each live class and build the hierarchy
        for (const liveClass of liveClasses) {
            try {
                const modules = await getClassModules(context, liveClass.courseId);
                if (!modules || modules.length === 0) {
                    continue;
                }

                console.log('modules for class', liveClass.courseId, modules);

                const modulesWithTopics: any[] = [];

                // Process modules in batches
                const modulePromises = modules.map(async (module) => {
                    try {
                        const topics = await getClassTopics(context, liveClass.courseId, module.classModuleId);
                        if (!topics || topics.length === 0) {
                            return null;
                        }

                        console.log('topics for module', module.classModuleId, topics);

                        const topicsWithSubtopics: any[] = [];

                        // Process topics in batches
                        const topicPromises = topics.map(async (topic) => {
                            try {
                                const subTopics = await getClassSubTopics(context, liveClass.courseId, module.classModuleId, topic.classTopicId);
                                if (!subTopics || subTopics.length === 0) {
                                    return null;
                                }

                                console.log('subTopics for topic', topic.classTopicId, subTopics);

                                const subTopicsWithNotes: any[] = [];

                                // Process subtopics in batches
                                const subTopicPromises = subTopics.map(async (subTopic) => {
                                    try {
                                        const notes = await getClassNotes(context, liveClass.courseId, module.classModuleId, topic.classTopicId, subTopic.subtopic_id);
                                        return {
                                            ...subTopic,
                                            notes: notes ? [notes] : []
                                        };
                                    } catch (error) {
                                        const msg = `Failed to fetch notes for subTopic ${subTopic.subtopic_id}: ${error instanceof Error ? error.message : String(error)}`;
                                        console.error(msg);
                                        errors.push(msg);
                                        return {
                                            ...subTopic,
                                            notes: [],
                                            error: msg
                                        };
                                    }
                                });

                                const subTopicResults = await processInBatches(subTopicPromises, 10);
                                subTopicsWithNotes.push(...subTopicResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));

                                return {
                                    ...topic,
                                    subTopics: subTopicsWithNotes
                                };
                            } catch (error) {
                                const msg = `Failed to fetch subtopics for topic ${topic.classTopicId}: ${error instanceof Error ? error.message : String(error)}`;
                                console.error(msg);
                                errors.push(msg);
                                return {
                                    ...topic,
                                    subTopics: [],
                                    error: msg
                                };
                            }
                        });

                        const topicResults = await processInBatches(topicPromises, 10);
                        topicsWithSubtopics.push(...topicResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));

                        return {
                            ...module,
                            topics: topicsWithSubtopics
                        };
                    } catch (error) {
                        const msg = `Failed to fetch topics for module ${module.classModuleId}: ${error instanceof Error ? error.message : String(error)}`;
                        console.error(msg);
                        errors.push(msg);
                        return {
                            ...module,
                            topics: [],
                            error: msg
                        };
                    }
                });

                const moduleResults = await processInBatches(modulePromises, 10);
                modulesWithTopics.push(...moduleResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));

                nestedData.push({
                    ...liveClass,
                    modules: modulesWithTopics
                });

            } catch (error) {
                const msg = `Failed to fetch modules for courseId=${liveClass.courseId}: ${error instanceof Error ? error.message : String(error)}`;
                console.error(msg);
                errors.push(msg);
                nestedData.push({
                    ...liveClass,
                    modules: [],
                    error: msg
                });
            }
        }

        // Create formatted output with nested structure
        const outputContent = `Nested Live Class Data: ${JSON.stringify(nestedData, null, 2)}\n\n` +
                             `Errors: ${JSON.stringify(errors, null, 2)}`;

        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `liveClassData-${Date.now()}.txt`);
        await fs.writeFile(tempFilePath, outputContent, 'utf-8');

        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(tempFilePath));
        await vscode.window.showTextDocument(document, { preview: false });

        return { liveClasses, modules: [], topics: [], subTopics: [], notes: [] };
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to fetch live class data: ${error}`);
        return null;
    }
}
