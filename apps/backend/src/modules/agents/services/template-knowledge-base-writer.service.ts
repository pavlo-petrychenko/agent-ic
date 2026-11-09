import type { TemplateKnowledgeBaseRequest } from '@/modules/agents/typedefs/agent-template.typedefs';

export abstract class TemplateKnowledgeBaseWriter {
  abstract create(workspaceId: string, request: TemplateKnowledgeBaseRequest): Promise<string>;
}
