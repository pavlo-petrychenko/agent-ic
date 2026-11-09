import type { Locale } from '@agent-ic/contracts';
import { AGENT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { agentTemplateNodeTypes, agentTemplates, buildAgentTemplate } from '@agent-ic/flow';
import type {
  AgentTemplateCategory,
  AgentTemplateKey,
  FlowDocument,
  NodeType,
} from '@agent-ic/flow';
import {
  CATEGORY_FILTER_ALL,
  GALLERY_TAB_KIND,
  KIND_GALLERY_TAB,
  TEMPLATE_CATEGORIES,
  TEMPLATE_PREVIEW_ID_PREFIX,
  TEMPLATE_PREVIEW_MODELS,
} from '@/features/agents/constants/agentTemplate.constants';
import { GalleryTab } from '@/features/agents/constants/agentTemplate.constants';
import type {
  AgentTemplateCard,
  AgentTemplateStep,
  CategoryFilter,
} from '@/features/agents/typedefs/agentTemplate.typedefs';
import { NODE_PRESENTATION, toFlowThumbnail } from '@/features/flow-builder';

const buildPreviewFlow = (
  key: AgentTemplateKey,
  locale: Locale,
  timeZone: string,
): FlowDocument => {
  let next = 0;
  return buildAgentTemplate(key, {
    locale,
    promptRefs: {},
    knowledgeBaseIds: [],
    knowledgeBases: {},
    timeZone,
    models: TEMPLATE_PREVIEW_MODELS,
    nextId: () => {
      next += 1;
      return `${TEMPLATE_PREVIEW_ID_PREFIX}${next}`;
    },
  });
};

export const toTemplateCards = (
  locale: Locale,
  timeZone: string,
  stepLabel: (type: NodeType) => string,
): AgentTemplateCard[] =>
  agentTemplates.map((template) => ({
    key: template.key,
    kind: template.kind,
    category: template.category,
    level: template.level,
    name: template.name[locale],
    description: template.description[locale],
    highlights: template.highlights.map((highlight) => highlight[locale]),
    usesKnowledge: template.usesKnowledge,
    steps: agentTemplateNodeTypes(template.key).map((type): AgentTemplateStep => ({
      type,
      label: stepLabel(type),
      ...NODE_PRESENTATION[type],
    })),
    graph: toFlowThumbnail(buildPreviewFlow(template.key, locale, timeZone)),
  }));

export const cardsOfTab = (
  cards: readonly AgentTemplateCard[],
  tab: GalleryTab,
): AgentTemplateCard[] => cards.filter((card) => card.kind === GALLERY_TAB_KIND[tab]);

export const galleryTabCounts = (
  cards: readonly AgentTemplateCard[],
): Readonly<Record<GalleryTab, number | null>> => ({
  [GalleryTab.Templates]: cardsOfTab(cards, GalleryTab.Templates).length,
  [GalleryTab.Examples]: cardsOfTab(cards, GalleryTab.Examples).length,
  [GalleryTab.Snippets]: cardsOfTab(cards, GalleryTab.Snippets).length,
  [GalleryTab.Blank]: null,
});

export const snippetCategories = (cards: readonly AgentTemplateCard[]): AgentTemplateCategory[] => {
  const present = new Set(cards.map((card) => card.category));
  return TEMPLATE_CATEGORIES.filter((category) => present.has(category));
};

export const filterByCategory = (
  cards: readonly AgentTemplateCard[],
  category: CategoryFilter,
): AgentTemplateCard[] =>
  category === CATEGORY_FILTER_ALL
    ? [...cards]
    : cards.filter((card) => card.category === category);

export const toCategoryFilter = (value: string): CategoryFilter =>
  TEMPLATE_CATEGORIES.find((category) => category === value) ?? CATEGORY_FILTER_ALL;

export const findCard = (
  cards: readonly AgentTemplateCard[],
  key: AgentTemplateKey | null,
): AgentTemplateCard | null =>
  key === null ? null : (cards.find((card) => card.key === key) ?? null);

export const tabOfCard = (card: AgentTemplateCard | null): GalleryTab | null =>
  card === null ? null : KIND_GALLERY_TAB[card.kind];

export const isTemplateNameValid = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= AGENT_NAME_MAX_LENGTH;
};
