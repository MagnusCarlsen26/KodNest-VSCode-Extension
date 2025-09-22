import { ProblemMeta } from '../../types';

// TODO: Very bad function. input : unknown ??
export function normalizeToProblemMeta(input: unknown): ProblemMeta {
    const asAny = input as any;
    const id = asAny?.id ?? asAny?.fileId ?? 'unknown-id';
    const title = asAny?.title ?? asAny?.label ?? 'Untitled Problem';
    const difficulty = asAny?.difficulty ?? 'Unknown';
    const content_markdown = asAny?.content_markdown ?? `# ${title}\n\n(Description not loaded during dev)`;
    const samples = Array.isArray(asAny?.samples) ? asAny.samples : [];
    const sectionId = asAny?.sectionId;
    const moduleId = asAny?.moduleId;
    const status = asAny?.status;
    const topic = asAny?.topic;
    const moduleName = asAny?.moduleName;
    const moduleDescription = asAny?.moduleDescription;
    const moduleDifficulty = asAny?.moduleDifficulty;
    const moduleCategoryTitle = asAny?.moduleCategoryTitle;
    return { id, title, difficulty, content_markdown, samples, sectionId, moduleId, status, topic, moduleName, moduleDescription, moduleDifficulty, moduleCategoryTitle, languages: asAny?.languages };
}