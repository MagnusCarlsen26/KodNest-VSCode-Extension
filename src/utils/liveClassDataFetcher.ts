import * as vscode from 'vscode';
import { getClassInfo } from '../services/api/liveClass/getClassInfo';
import { getClassModules } from '../services/api/liveClass/getClassModules';
import { getClassTopics } from '../services/api/liveClass/getClassTopics';
import { getClassSubTopics } from '../services/api/liveClass/getClassSubTopics';
import { getClassNotes } from '../services/api/liveClass/getClassNotes';
import { ClassInfo, ClassModule, ClassTopic, ClassSubtopic, ClassNotes } from '../types';

export async function fetchLiveClassData(context: vscode.ExtensionContext, courseId: string): Promise<{
    liveClasses: ClassInfo[];
    modules: ClassModule[];
    topics: ClassTopic[];
    subTopics: ClassSubtopic[];
    notes: ClassNotes[];
} | null> {
    try {
        const liveClasses = await getClassInfo(context, courseId);

        if (!liveClasses || liveClasses.length === 0) {
            vscode.window.showInformationMessage('No live classes found.');
            return null;
        }

        console.log('liveClasses', liveClasses);
        const firstLiveClass = liveClasses[0];
        const modules = await getClassModules(context, firstLiveClass.courseId);

        if (!modules || modules.length === 0) {
            vscode.window.showInformationMessage('No modules found for the live class.');
            return { liveClasses, modules: [], topics: [], subTopics: [], notes: [] };
        }

        console.log('modules', modules);
        const firstModule = modules[0];
        const topics = await getClassTopics(context, firstLiveClass.courseId, firstModule.classModuleId);

        if (!topics || topics.length === 0) {
            vscode.window.showInformationMessage('No topics found for the module.');
            return { liveClasses, modules, topics: [], subTopics: [], notes: [] };
        }

        console.log('topics', topics);
        const firstTopic = topics[0];
        const subTopics = await getClassSubTopics(context, firstLiveClass.courseId, firstModule.classModuleId, firstTopic.classTopicId);

        if (!subTopics || subTopics.length === 0) {
            vscode.window.showInformationMessage('No subtopics found for the topic.');
            return { liveClasses, modules, topics, subTopics: [], notes: [] };
        }

        console.log('subTopics', subTopics);
        const firstSubTopic = subTopics[0];
        const notes = await getClassNotes(context, firstLiveClass.courseId, firstModule.classModuleId, firstTopic.classTopicId, firstSubTopic.subtopic_id);

        // TODO: Process and combine the data from all API calls
        return { liveClasses, modules, topics, subTopics, notes };
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to fetch live class data: ${error}`);
        return null;
    }
}
