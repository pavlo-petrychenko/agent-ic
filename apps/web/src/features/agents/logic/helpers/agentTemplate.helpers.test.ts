import { Locale } from '@agent-ic/contracts';
import {
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  agentTemplates,
} from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  CATEGORY_FILTER_ALL,
  GalleryTab,
} from '@/features/agents/constants/agentTemplate.constants';
import {
  cardsOfTab,
  filterByCategory,
  findCard,
  galleryTabCounts,
  isTemplateNameValid,
  snippetCategories,
  tabOfCard,
  toCategoryFilter,
  toTemplateCards,
} from '@/features/agents/logic/helpers/agentTemplate.helpers';

const stepLabel = (type: string) => `label:${type}`;
const cards = toTemplateCards(Locale.En, 'UTC', stepLabel);

describe('toTemplateCards', () => {
  it('turns every catalog entry into a card in catalog order', () => {
    expect(cards.map((card) => card.key)).toEqual(agentTemplates.map((template) => template.key));
  });

  it('localizes the texts', () => {
    const english = cards.find((card) => card.key === AgentTemplateKey.CafeSupport);
    const ukrainian = toTemplateCards(Locale.Uk, 'UTC', stepLabel).find(
      (card) => card.key === AgentTemplateKey.CafeSupport,
    );

    expect(english?.name).toBe('Café support');
    expect(ukrainian?.name).not.toBe(english?.name);
    expect(ukrainian?.highlights).toHaveLength(english?.highlights.length ?? 0);
  });

  it('builds a thumbnail graph and labelled steps for each card', () => {
    for (const card of cards) {
      expect(card.graph.nodes.length).toBeGreaterThan(0);
      expect(card.graph.edges.length).toBeGreaterThan(0);
      expect(card.steps.length).toBeGreaterThan(0);
      expect(card.steps.every((step) => step.label === `label:${step.type}`)).toBe(true);
    }
  });

  it('marks the templates that use knowledge', () => {
    expect(cards.find((card) => card.key === AgentTemplateKey.CafeSupport)?.usesKnowledge).toBe(
      true,
    );
    expect(cards.find((card) => card.key === AgentTemplateKey.MenuButtons)?.usesKnowledge).toBe(
      false,
    );
  });
});

describe('tabs and categories', () => {
  it('splits the cards into the templates, big examples and small examples tabs by kind', () => {
    const templates = cardsOfTab(cards, GalleryTab.Templates);
    const examples = cardsOfTab(cards, GalleryTab.Examples);
    const snippets = cardsOfTab(cards, GalleryTab.Snippets);

    expect(templates.map((card) => card.key)).toEqual([
      AgentTemplateKey.FaqFromDocuments,
      AgentTemplateKey.LeadHandling,
      AgentTemplateKey.AppointmentBooking,
      AgentTemplateKey.RouteToSpecialists,
    ]);
    expect(examples.map((card) => card.key)).toEqual([
      AgentTemplateKey.CafeSupport,
      AgentTemplateKey.StoreSales,
    ]);
    expect(snippets.every((card) => card.kind === AgentTemplateKind.Snippet)).toBe(true);
    expect(cardsOfTab(cards, GalleryTab.Blank)).toEqual([]);
    expect(templates.length + examples.length + snippets.length).toBe(cards.length);
  });

  it('counts the cards of each tab and gives the blank tab no count', () => {
    expect(galleryTabCounts(cards)).toEqual({
      [GalleryTab.Templates]: 4,
      [GalleryTab.Examples]: 2,
      [GalleryTab.Snippets]: cards.length - 6,
      [GalleryTab.Blank]: null,
    });
  });

  it('lists the categories that have examples, in a fixed order', () => {
    expect(snippetCategories(cardsOfTab(cards, GalleryTab.Snippets))).toEqual([
      AgentTemplateCategory.Support,
      AgentTemplateCategory.Sales,
      AgentTemplateCategory.Quality,
      AgentTemplateCategory.FollowUp,
    ]);
    expect(snippetCategories([])).toEqual([]);
  });

  it('filters by category and keeps everything for all', () => {
    const snippets = cardsOfTab(cards, GalleryTab.Snippets);

    expect(filterByCategory(snippets, CATEGORY_FILTER_ALL)).toHaveLength(snippets.length);
    expect(
      filterByCategory(snippets, AgentTemplateCategory.Quality).map((card) => card.key),
    ).toEqual([AgentTemplateKey.GuardedReply, AgentTemplateKey.BackgroundReview]);
  });

  it('reads a category from text and falls back to all', () => {
    expect(toCategoryFilter('sales')).toBe(AgentTemplateCategory.Sales);
    expect(toCategoryFilter('follow_up')).toBe(AgentTemplateCategory.FollowUp);
    expect(toCategoryFilter('nothing')).toBe(CATEGORY_FILTER_ALL);
  });

  it('finds a card and the tab that holds it', () => {
    expect(findCard(cards, AgentTemplateKey.StoreSales)?.key).toBe(AgentTemplateKey.StoreSales);
    expect(findCard(cards, null)).toBeNull();
    expect(tabOfCard(findCard(cards, AgentTemplateKey.StoreSales))).toBe(GalleryTab.Examples);
    expect(tabOfCard(findCard(cards, AgentTemplateKey.LeadHandling))).toBe(GalleryTab.Templates);
    expect(tabOfCard(findCard(cards, AgentTemplateKey.CloseChat))).toBe(GalleryTab.Snippets);
    expect(tabOfCard(null)).toBeNull();
  });
});

describe('isTemplateNameValid', () => {
  it('needs a name that is not blank and not too long', () => {
    expect(isTemplateNameValid('Café')).toBe(true);
    expect(isTemplateNameValid('   ')).toBe(false);
    expect(isTemplateNameValid('')).toBe(false);
    expect(isTemplateNameValid('a'.repeat(100))).toBe(true);
    expect(isTemplateNameValid('a'.repeat(101))).toBe(false);
  });
});
