export interface SampleCase {
  input: string;
  output?: string;
}

export interface Language {
  id: string;
  name: string;
  boilerplate: string;
}

export interface ProblemMeta {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
  content_markdown?: string;
  samples?: SampleCase[];
  sectionId?: string;
  status?: string;
  topic?: string;
  moduleName?: string;
  moduleDescription?: string;
  moduleDifficulty?: string;
  moduleCategoryTitle?: string;
  languages?: Language[];
}

export interface Module {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  progress: number;
  noOfQuestions: number;
  categoryTitle: string;
  problems: Problem[];
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
  status?: string;
  topic?: string;
  content_markdown?: string;
  samples?: SampleCase[];
  sectionId?: string;
  moduleName?: string;
  moduleDescription?: string;
  moduleDifficulty?: string;
  moduleCategoryTitle?: string;
  languages?: Language[];
}

export interface RunPayload {
  problem?: ProblemMeta;
  sampleIndex?: number;
}


