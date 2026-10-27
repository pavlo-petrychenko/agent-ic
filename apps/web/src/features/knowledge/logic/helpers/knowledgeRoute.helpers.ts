export const knowledgePath = (workspaceId: string): string => `/w/${workspaceId}/knowledge`;

export const knowledgeBasePath = (workspaceId: string, knowledgeBaseId: string): string =>
  `${knowledgePath(workspaceId)}?kb=${encodeURIComponent(knowledgeBaseId)}`;
