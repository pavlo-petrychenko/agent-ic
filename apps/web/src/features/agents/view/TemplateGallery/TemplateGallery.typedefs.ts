import type { AgentTemplateCategory, AgentTemplateKey } from '@agent-ic/flow';
import type { GalleryTab } from '@/features/agents/constants/agentTemplate.constants';
import type {
  AgentTemplateCard,
  CategoryFilter,
} from '@/features/agents/typedefs/agentTemplate.typedefs';

export interface TemplateGalleryProps {
  tab: GalleryTab;
  tabCounts: Readonly<Record<GalleryTab, number>>;
  category: CategoryFilter;
  categories: readonly AgentTemplateCategory[];
  cards: readonly AgentTemplateCard[];
  focusKey: AgentTemplateKey | null;
  blankCreating: boolean;
  onTabChange: (tab: GalleryTab) => void;
  onCategoryChange: (category: string) => void;
  onSelect: (key: AgentTemplateKey) => void;
  onCreateBlank: () => void;
}
