export interface FileRule {
  readonly topic: RegExp;
  readonly suffixes: readonly string[];
  readonly testSuffixes: readonly string[];
}

export interface Violation {
  readonly file: string;
  readonly message: string;
}

export interface StructureAreas {
  readonly backendSource: string;
  readonly backendTest: string;
  readonly webSource: string;
  readonly webTest: string;
}

export type Verdict = string | null;
export type Segments = readonly string[];
