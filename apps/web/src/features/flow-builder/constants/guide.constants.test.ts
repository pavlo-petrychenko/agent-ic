import { Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import {
  ComponentGuideId,
  ConceptGuideId,
  GUIDE_LINK_TARGETS,
  GUIDE_TOKENS,
  GUIDES,
  GuideLink,
  GuideType,
} from '@/features/flow-builder/constants/guide.constants';
import type { ComponentGuide, ConceptGuide } from '@/features/flow-builder/typedefs/guide.typedefs';
import { Namespace } from '@/shared/i18n/constants/namespace.constants';
import { resources } from '@/shared/i18n/constants/resources.constants';

const TOKEN_PATTERN = /\{\{(\w+)\}\}/g;
const FOREIGN_MARKUP = /<(?!\/?code>)/;

const COMPONENT_GUIDES = GUIDES.flatMap((guide): ComponentGuide[] =>
  guide.type === GuideType.Component ? [guide] : [],
);
const CONCEPT_GUIDES = GUIDES.flatMap((guide): ConceptGuide[] =>
  guide.type === GuideType.Concept ? [guide] : [],
);

describe.each(Object.values(Locale))('guide copy in %s', (locale) => {
  const copy = resources[locale][Namespace.FlowBuilder].guide;

  it.each(COMPONENT_GUIDES.map((guide) => guide.id))('has the declared lists for %s', (id) => {
    const guide = COMPONENT_GUIDES.find((candidate) => candidate.id === id);
    const text = copy.items[id];

    expect(text.when).toHaveLength(guide?.whenCount ?? -1);
    expect(text.tips).toHaveLength(guide?.tipCount ?? -1);
    expect(text.does).not.toBe('');
    expect(text.summary).not.toBe('');
  });

  it.each(CONCEPT_GUIDES.map((guide) => guide.id))('has the declared list for %s', (id) => {
    const guide = CONCEPT_GUIDES.find((candidate) => candidate.id === id);
    const text = copy.items[id];

    expect(text.points).toHaveLength(guide?.pointCount ?? -1);
    expect(text.title).not.toBe('');
    expect(text.summary).not.toBe('');
  });

  it('uses only known tokens and plain code markup', () => {
    const texts = JSON.stringify(copy.items);
    const tokens = [...texts.matchAll(TOKEN_PATTERN)].map((match) => match[1] ?? '');

    expect(tokens.filter((token) => !(token in GUIDE_TOKENS))).toEqual([]);
    expect(FOREIGN_MARKUP.test(texts)).toBe(false);
  });

  it('names every link a concept can show', () => {
    Object.values(GuideLink).forEach((link) => {
      expect(copy.link[link]).not.toBe('');
    });
  });
});

describe('guide definitions', () => {
  it('has a guide for each id, once', () => {
    const ids = [...Object.values(ComponentGuideId), ...Object.values(ConceptGuideId)];

    expect(GUIDES.map((guide) => guide.id).sort()).toEqual(ids.sort());
  });

  it('points every link to a workspace page', () => {
    Object.values(GUIDE_LINK_TARGETS).forEach((target) => {
      expect(target.to.startsWith('/w/$workspaceId/')).toBe(true);
    });
  });
});
