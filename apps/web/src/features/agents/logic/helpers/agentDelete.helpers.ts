export const isDeleteConfirmed = (typedName: string, agentName: string): boolean =>
  typedName.trim() === agentName.trim();
