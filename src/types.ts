export interface SampleCase {
  input: string;
  output?: string;
}

export interface ProblemMeta {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content_markdown?: string;
  samples?: SampleCase[];
  sectionId?: string;
  status?: string;
  topic?: string;
  moduleName?: string;
  moduleDescription?: string;
  moduleDifficulty?: string;
  moduleCategoryTitle?: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status?: string;
  topic?: string;
  content_markdown?: string;
}

export interface RunPayload {
  problem?: ProblemMeta;
  sampleIndex?: number;
}


