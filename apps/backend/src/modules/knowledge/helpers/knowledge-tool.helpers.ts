export const presentScopeId = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
};

export const isKnowledgeToolFailure = (output: unknown): boolean =>
  typeof output === 'object' && output !== null && 'error' in output && output.error !== undefined;
