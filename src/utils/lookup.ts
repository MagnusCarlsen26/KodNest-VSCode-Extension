import * as path from 'path';

interface QuestionContext {
  moduleId: string;
  sectionId: string;
}

const cacheByExtensionPath: Map<string, Map<string, QuestionContext>> = new Map();

export async function getQuestionContextById(
  extensionFsPath: string,
  questionId: string,
): Promise<QuestionContext | undefined> {
  if (!extensionFsPath || !questionId) { return undefined; }

  let map = cacheByExtensionPath.get(extensionFsPath);
  if (!map) {
    map = await buildIndex(extensionFsPath);
    cacheByExtensionPath.set(extensionFsPath, map);
  }
  return map.get(questionId);
}

async function buildIndex(extensionFsPath: string): Promise<Map<string, QuestionContext>> {
  const index: Map<string, QuestionContext> = new Map();
  try {
    const fs = await import('fs');
    const databasePath = path.join(extensionFsPath, 'database', 'allQuestionDescriptions.json');
    const raw = fs.readFileSync(databasePath, 'utf-8');
    const data = JSON.parse(raw);
    for (const moduleData of data) {
      const moduleId: string = moduleData?.module?.id;
      const sections = moduleData?.sections || {};
      for (const sectionId of Object.keys(sections)) {
        const section = sections[sectionId] || {};
        for (const problemId of Object.keys(section)) {
          const item = section[problemId];
          const qid: string = item?.id || problemId;
          if (qid) {
            index.set(qid, { moduleId, sectionId });
          }
        }
      }
    }
  } catch {
    // ignore and return empty index
  }
  return index;
}


