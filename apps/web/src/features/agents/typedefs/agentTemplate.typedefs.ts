import type {
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateLevel,
  NodeType,
} from '@agent-ic/flow';
import type { CATEGORY_FILTER_ALL } from '@/features/agents/constants/agentTemplate.constants';
import type { FlowThumbnailGraph } from '@/features/flow-builder';
import type { NodeKind } from '@/shared/ui/display/NodeTile';
import type { IconName } from '@/shared/ui/foundations/Icon';

export type CategoryFilter = AgentTemplateCategory | typeof CATEGORY_FILTER_ALL;

export interface AgentTemplateStep {
  readonly type: NodeType;
  readonly label: string;
  readonly kind: NodeKind;
  readonly icon: IconName;
}

export interface AgentTemplateCard {
  readonly key: AgentTemplateKey;
  readonly kind: AgentTemplateKind;
  readonly category: AgentTemplateCategory;
  readonly level: AgentTemplateLevel;
  readonly name: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly usesKnowledge: boolean;
  readonly steps: readonly AgentTemplateStep[];
  readonly graph: FlowThumbnailGraph;
}

export interface TemplateKnowledgeBase {
  readonly id: string;
  readonly name: string;
  readonly documentCount: number;
}

export interface UseTemplateKnowledgeBasesResult {
  readonly knowledgeBases: readonly TemplateKnowledgeBase[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface CreateFromTemplateInput {
  readonly templateKey: AgentTemplateKey;
  readonly name: string;
  readonly knowledgeBaseIds: readonly string[];
}

export interface UseCreateAgentFromTemplateResult {
  readonly createFromTemplate: (input: CreateFromTemplateInput) => Promise<string | null>;
  readonly creating: boolean;
}

export interface TemplateSetup {
  readonly name: string;
  readonly knowledgeBaseIds: readonly string[];
  readonly setName: (name: string) => void;
  readonly setKnowledgeBaseIds: (ids: readonly string[]) => void;
}

export interface TemplateSetupDraft {
  readonly templateKey: AgentTemplateKey;
  readonly name: string | null;
  readonly knowledgeBaseIds: readonly string[];
}
