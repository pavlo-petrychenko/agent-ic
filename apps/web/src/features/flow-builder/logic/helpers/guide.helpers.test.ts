import { NodeType } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  ComponentGuideId,
  ConceptGuideId,
  GUIDE_GROUP_ORDER,
  GUIDES,
  GuideGroup,
  GuideType,
} from '@/features/flow-builder/constants/guide.constants';
import { PALETTE_SECTIONS } from '@/features/flow-builder/constants/palette.constants';
import {
  filterGuideItems,
  findGuide,
  guideOfNodeType,
  guideSections,
  guideTitleKey,
} from '@/features/flow-builder/logic/helpers/guide.helpers';
import type { GuideListSection } from '@/features/flow-builder/typedefs/guide.typedefs';
import { NodeKind } from '@/shared/ui/display/NodeTile';
import { IconName } from '@/shared/ui/foundations/Icon';

const item = (id: ComponentGuideId, title: string, summary: string) => ({
  id,
  title,
  summary,
  kind: NodeKind.Agent,
  icon: IconName.Agent,
});

const LIST: readonly GuideListSection[] = [
  {
    group: GuideGroup.Ai,
    items: [
      item(ComponentGuideId.Agent, 'Agent', 'An AI that answers'),
      item(ComponentGuideId.Completion, 'Completion', 'One AI call'),
    ],
  },
  {
    group: GuideGroup.Actions,
    items: [item(ComponentGuideId.SendMessage, 'Send message', 'Writes to the customer')],
  },
];

describe('guideSections', () => {
  it('groups the guides like the palette, then the concepts', () => {
    const sections = guideSections();

    expect(sections.map((section) => section.group)).toEqual(GUIDE_GROUP_ORDER);
    expect(sections.slice(0, PALETTE_SECTIONS.length).map((section) => section.group)).toEqual(
      PALETTE_SECTIONS.map((section) => section.group),
    );
    expect(
      sections
        .slice(0, PALETTE_SECTIONS.length)
        .map((section) =>
          section.guides.flatMap((guide) =>
            guide.type === GuideType.Component ? [guide.nodeType] : [],
          ),
        ),
    ).toEqual(PALETTE_SECTIONS.map((section) => section.types));
    expect(sections.find((section) => section.group === GuideGroup.Concepts)?.guides).toHaveLength(
      Object.values(ConceptGuideId).length,
    );
  });

  it('has a guide for every node type of the palette', () => {
    PALETTE_SECTIONS.flatMap((section) => section.types).forEach((type) => {
      expect(guideOfNodeType(type)).not.toBeNull();
    });
  });

  it('has no guide for a node type the palette does not offer', () => {
    expect(guideOfNodeType(NodeType.TriggerExternalEvent)).toBeNull();
  });

  it('has a unique id for each guide', () => {
    expect(new Set(GUIDES.map((guide) => guide.id)).size).toBe(GUIDES.length);
  });
});

describe('filterGuideItems', () => {
  it('keeps everything for an empty query', () => {
    expect(filterGuideItems(LIST, '  ')).toEqual(LIST);
  });

  it('matches the title, ignoring case', () => {
    const result = filterGuideItems(LIST, 'SEND');

    expect(result.map((section) => section.group)).toEqual([GuideGroup.Actions]);
  });

  it('matches the summary and drops sections with no match', () => {
    const result = filterGuideItems(LIST, 'one ai');

    expect(result).toHaveLength(1);
    expect(result[0]?.items.map((found) => found.id)).toEqual([ComponentGuideId.Completion]);
  });

  it('returns nothing when no guide matches', () => {
    expect(filterGuideItems(LIST, 'zzz')).toEqual([]);
  });
});

describe('findGuide and guideTitleKey', () => {
  it('finds a guide by its id', () => {
    expect(findGuide(ConceptGuideId.Variables)?.type).toBe(GuideType.Concept);
    expect(findGuide(null)).toBeNull();
  });

  it('titles a component guide by its step and a concept by its own text', () => {
    const agent = findGuide(ComponentGuideId.Agent);
    const variables = findGuide(ConceptGuideId.Variables);

    expect(agent && guideTitleKey(agent)).toBe('step.agent');
    expect(variables && guideTitleKey(variables)).toBe('guide.items.variables.title');
  });
});
