import type { AgentTemplateKey } from '@agent-ic/flow';
import type { AgentTemplateCard } from '@/features/agents/typedefs/agentTemplate.typedefs';

export interface AgentsEmptyProps {
  creating: boolean;
  canCreate: boolean;
  templates: readonly AgentTemplateCard[];
  onBrowseTemplates: () => void;
  onCreateBlank: () => void;
  onUseTemplate: (key: AgentTemplateKey) => void;
}
