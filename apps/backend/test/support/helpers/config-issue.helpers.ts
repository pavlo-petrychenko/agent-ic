import { ConfigError } from '@/platform/config/errors/config.error';
import type { ConfigIssue } from '@/platform/config/typedefs/config-issue.typedefs';

export const issuesOf = (load: () => unknown): readonly ConfigIssue[] => {
  try {
    load();
  } catch (error) {
    if (error instanceof ConfigError) {
      return error.issues;
    }
    throw error;
  }
  return [];
};

export const variablesOf = (issues: readonly ConfigIssue[]): string[] =>
  issues.map((issue) => issue.variable);
