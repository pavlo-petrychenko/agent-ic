export const knowledgeBasePath = (workspaceId: string, knowledgeBaseId: string): string =>
  `/w/${workspaceId}/knowledge?kb=${encodeURIComponent(knowledgeBaseId)}`;
