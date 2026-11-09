import type { NodeType } from '@agent-ic/flow';
import {
  GUIDE_BY_NODE_TYPE,
  GUIDE_GROUP_ORDER,
  GUIDES,
} from '@/features/flow-builder/constants/guide.constants';
import { GuideType } from '@/features/flow-builder/constants/guide.constants';
import type { ConceptGuideId, GuideId } from '@/features/flow-builder/constants/guide.constants';
import type {
  GuideDefinition,
  GuideListSection,
  GuideSection,
} from '@/features/flow-builder/typedefs/guide.typedefs';

export const guideSections = (): GuideSection[] =>
  GUIDE_GROUP_ORDER.map((group) => ({
    group,
    guides: GUIDES.filter((guide) => guide.group === group),
  })).filter((section) => section.guides.length > 0);

export const filterGuideItems = (
  sections: readonly GuideListSection[],
  query: string,
): GuideListSection[] => {
  const needle = query.trim().toLocaleLowerCase();
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        `${item.title} ${item.summary}`.toLocaleLowerCase().includes(needle),
      ),
    }))
    .filter((section) => section.items.length > 0);
};

export const findGuide = (id: GuideId | null): GuideDefinition | null =>
  GUIDES.find((guide) => guide.id === id) ?? null;

export const guideOfNodeType = (type: NodeType): GuideId | null =>
  GUIDE_BY_NODE_TYPE.get(type) ?? null;

export const guideTitleKey = (
  guide: GuideDefinition,
): `step.${NodeType}` | `guide.items.${ConceptGuideId}.title` =>
  guide.type === GuideType.Component ? `step.${guide.nodeType}` : `guide.items.${guide.id}.title`;
