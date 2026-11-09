import type { AgentTemplateKey } from '@agent-ic/flow';
import type { AgentTemplateCard } from '@/features/agents/typedefs/agentTemplate.typedefs';
import type { TemplateCardSize } from '@/features/agents/view/TemplateCard/TemplateCard.constants';

export interface TemplateCardProps {
  card: AgentTemplateCard;
  size: TemplateCardSize;
  actionLabel: string | null;
  onSelect: (key: AgentTemplateKey) => void;
}
