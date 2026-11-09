import type { AgentTemplateKey, NodeType } from '@agent-ic/flow';
import type {
  ComponentGuideId,
  ConceptGuideId,
  GuideGroup,
  GuideId,
  GuideLink,
  GuideType,
} from '@/features/flow-builder/constants/guide.constants';
import type { FlowThumbnailGraph } from '@/features/flow-builder/typedefs/flowThumbnail.typedefs';
import type { NodeKind } from '@/shared/ui/display/NodeTile';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface ComponentGuide {
  type: GuideType.Component;
  id: ComponentGuideId;
  group: GuideGroup;
  nodeType: NodeType;
  kind: NodeKind;
  icon: IconName;
  whenCount: number;
  tipCount: number;
}

export interface ConceptGuide {
  type: GuideType.Concept;
  id: ConceptGuideId;
  group: GuideGroup;
  kind: NodeKind;
  icon: IconName;
  pointCount: number;
  links: readonly GuideLink[];
}

export type GuideDefinition = ComponentGuide | ConceptGuide;

export interface GuideSection {
  group: GuideGroup;
  guides: readonly GuideDefinition[];
}

export interface GuideListItem {
  id: GuideId;
  title: string;
  summary: string;
  kind: NodeKind;
  icon: IconName;
}

export interface GuideListSection {
  group: GuideGroup;
  items: readonly GuideListItem[];
}

export interface GuideLinkTarget {
  to: string;
  withAgent: boolean;
}

export interface GuideTemplateRef {
  key: AgentTemplateKey;
  name: string;
}

export interface GuideExample {
  key: AgentTemplateKey;
  name: string;
  description: string;
  graph: FlowThumbnailGraph;
  alsoIn: readonly GuideTemplateRef[];
}

export interface GuideStoreState {
  open: boolean;
  guideId: GuideId | null;
}

export interface GuideStore extends GuideStoreState {
  openGuide: (guideId: GuideId | null) => void;
  showList: () => void;
  close: () => void;
}
