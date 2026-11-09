import type {
  TemplatePromptRefs,
  TemplatePromptRequest,
} from '@/modules/agents/typedefs/agent-template.typedefs';

export abstract class TemplatePromptWriter {
  abstract ensure(workspaceId: string, request: TemplatePromptRequest): Promise<TemplatePromptRefs>;
}
