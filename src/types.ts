export interface SampleCase {
  input: string;
  output?: string;
}

export interface ProblemMeta {
  id: string;
  title: string;
  difficulty?: string;
  content_markdown?: string;
  samples?: SampleCase[];
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface RunPayload {
  problem?: ProblemMeta;
  sampleIndex?: number;
}


