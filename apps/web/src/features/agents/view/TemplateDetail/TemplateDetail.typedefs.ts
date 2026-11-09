import type {
  AgentTemplateCard,
  TemplateKnowledgeBase,
} from '@/features/agents/typedefs/agentTemplate.typedefs';

export interface TemplateDetailKnowledge {
  knowledgeBases: readonly TemplateKnowledgeBase[];
  selectedIds: readonly string[];
  loading: boolean;
  failed: boolean;
  knowledgeHref: string;
}

export interface TemplateDetailProps {
  card: AgentTemplateCard;
  name: string;
  nameInvalid: boolean;
  knowledge: TemplateDetailKnowledge | null;
  disabled: boolean;
  onNameChange: (name: string) => void;
  onToggleKnowledgeBase: (id: string) => void;
  onRetryKnowledge: () => void;
  onOpenKnowledge: () => void;
  onSubmit: () => void;
}
