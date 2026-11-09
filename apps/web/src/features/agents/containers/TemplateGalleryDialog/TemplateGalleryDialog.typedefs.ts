import type { AgentTemplateKey } from '@agent-ic/flow';
import type { AgentTemplateCard } from '@/features/agents/typedefs/agentTemplate.typedefs';

export interface TemplateGalleryDialogProps {
  workspaceId: string;
  templates: readonly AgentTemplateCard[];
  selectedKey: AgentTemplateKey | null;
  blankCreating: boolean;
  onSelect: (key: AgentTemplateKey | null) => void;
  onClose: () => void;
  onCreateBlank: () => Promise<void>;
}
