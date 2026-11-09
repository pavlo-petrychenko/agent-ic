import { NodeType } from '@agent-ic/flow';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import type {
  ComponentGuide,
  ConceptGuide,
  GuideDefinition,
  GuideLinkTarget,
} from '@/features/flow-builder/typedefs/guide.typedefs';
import { NodeKind } from '@/shared/ui/display/NodeTile';
import { IconName } from '@/shared/ui/foundations/Icon';

export enum ComponentGuideId {
  TriggerMessage = 'trigger_message',
  TriggerSchedule = 'trigger_schedule',
  TriggerInactivity = 'trigger_inactivity',
  Agent = 'agent',
  Completion = 'completion',
  Router = 'router',
  Parallel = 'parallel',
  SendMessage = 'send_message',
  ApiRequest = 'api_request',
  Escalation = 'escalation',
}

export enum ConceptGuideId {
  Variables = 'variables',
  KnowledgeBases = 'knowledge_bases',
  Channels = 'channels',
  HandOff = 'hand_off',
  InboxNotifications = 'inbox_notifications',
  TestingTraces = 'testing_traces',
  Publishing = 'publishing',
}

export type GuideId = ComponentGuideId | ConceptGuideId;

export enum GuideType {
  Component = 'component',
  Concept = 'concept',
}

export enum GuideGroup {
  Triggers = 'triggers',
  Ai = 'ai',
  Flow = 'flow',
  Actions = 'actions',
  Concepts = 'concepts',
}

export enum GuideLink {
  Knowledge = 'knowledge',
  Channels = 'channels',
  Inbox = 'inbox',
  Notifications = 'notifications',
  Testing = 'testing',
  Versions = 'versions',
}

export const GUIDE_GROUP_ORDER: readonly GuideGroup[] = [
  GuideGroup.Triggers,
  GuideGroup.Ai,
  GuideGroup.Flow,
  GuideGroup.Actions,
  GuideGroup.Concepts,
];

export const GUIDE_LINK_TARGETS: Readonly<Record<GuideLink, GuideLinkTarget>> = {
  [GuideLink.Knowledge]: { to: '/w/$workspaceId/knowledge', withAgent: false },
  [GuideLink.Channels]: { to: '/w/$workspaceId/channels', withAgent: false },
  [GuideLink.Inbox]: { to: '/w/$workspaceId/inbox', withAgent: false },
  [GuideLink.Notifications]: { to: '/w/$workspaceId/settings/notifications', withAgent: false },
  [GuideLink.Testing]: { to: '/w/$workspaceId/testing', withAgent: true },
  [GuideLink.Versions]: { to: '/w/$workspaceId/testing/versions', withAgent: true },
};

const componentGuide = (
  id: ComponentGuideId,
  group: GuideGroup,
  nodeType: NodeType,
  whenCount: number,
  tipCount: number,
): ComponentGuide => ({
  type: GuideType.Component,
  id,
  group,
  nodeType,
  kind: NODE_PRESENTATION[nodeType].kind,
  icon: NODE_PRESENTATION[nodeType].icon,
  whenCount,
  tipCount,
});

const conceptGuide = (
  id: ConceptGuideId,
  kind: NodeKind,
  icon: IconName,
  pointCount: number,
  links: readonly GuideLink[],
): ConceptGuide => ({
  type: GuideType.Concept,
  id,
  group: GuideGroup.Concepts,
  kind,
  icon,
  pointCount,
  links,
});

export const GUIDES: readonly GuideDefinition[] = [
  componentGuide(
    ComponentGuideId.TriggerMessage,
    GuideGroup.Triggers,
    NodeType.TriggerMessage,
    3,
    3,
  ),
  componentGuide(
    ComponentGuideId.TriggerSchedule,
    GuideGroup.Triggers,
    NodeType.TriggerSchedule,
    3,
    4,
  ),
  componentGuide(
    ComponentGuideId.TriggerInactivity,
    GuideGroup.Triggers,
    NodeType.TriggerInactivity,
    3,
    4,
  ),
  componentGuide(ComponentGuideId.Agent, GuideGroup.Ai, NodeType.Agent, 4, 4),
  componentGuide(ComponentGuideId.Completion, GuideGroup.Ai, NodeType.Completion, 4, 4),
  componentGuide(ComponentGuideId.Router, GuideGroup.Flow, NodeType.Router, 4, 4),
  componentGuide(ComponentGuideId.Parallel, GuideGroup.Flow, NodeType.Parallel, 3, 4),
  componentGuide(ComponentGuideId.SendMessage, GuideGroup.Actions, NodeType.SendMessage, 3, 3),
  componentGuide(ComponentGuideId.ApiRequest, GuideGroup.Actions, NodeType.ApiRequest, 3, 4),
  componentGuide(ComponentGuideId.Escalation, GuideGroup.Actions, NodeType.Escalation, 4, 4),
  conceptGuide(ConceptGuideId.Variables, NodeKind.Var, IconName.Var, 5, []),
  conceptGuide(ConceptGuideId.KnowledgeBases, NodeKind.Kb, IconName.Kb, 5, [GuideLink.Knowledge]),
  conceptGuide(ConceptGuideId.Channels, NodeKind.Info, IconName.Channels, 4, [GuideLink.Channels]),
  conceptGuide(ConceptGuideId.HandOff, NodeKind.Esc, IconName.Hand, 4, [GuideLink.Inbox]),
  conceptGuide(ConceptGuideId.InboxNotifications, NodeKind.Neutral, IconName.Inbox, 5, [
    GuideLink.Inbox,
    GuideLink.Notifications,
  ]),
  conceptGuide(ConceptGuideId.TestingTraces, NodeKind.Ok, IconName.Flask, 4, [GuideLink.Testing]),
  conceptGuide(ConceptGuideId.Publishing, NodeKind.Accent, IconName.Upload, 5, [
    GuideLink.Versions,
  ]),
];

export const GUIDE_BY_NODE_TYPE: ReadonlyMap<NodeType, GuideId> = new Map(
  GUIDES.flatMap((guide): [NodeType, GuideId][] =>
    guide.type === GuideType.Component ? [[guide.nodeType, guide.id]] : [],
  ),
);

export const GUIDE_GROUP_LABEL_KEYS = {
  [GuideGroup.Triggers]: 'palette.group.triggers',
  [GuideGroup.Ai]: 'palette.group.ai',
  [GuideGroup.Flow]: 'palette.group.flow',
  [GuideGroup.Actions]: 'palette.group.actions',
  [GuideGroup.Concepts]: 'guide.group.concepts',
} as const satisfies Record<GuideGroup, string>;

export const GUIDES_DRAWER_WIDTH = 440;
export const GUIDE_EXAMPLE_ID_PREFIX = 'guide_';
export const GUIDE_EXAMPLE_TIME_ZONE = 'UTC';
export const GUIDE_EXAMPLE_MODELS = { agent: '', completion: '' };
export const GUIDE_PALETTE_INFO_ICON = IconName.Info;
export const GUIDES_TOOLBAR_ICON = IconName.Note;
export const AGENTS_PATH = '/w/$workspaceId/agents';

export const GUIDE_TOKENS: Readonly<Record<string, string>> = {
  stepField: '{{step.field}}',
  triageIntent: '{{triage.intent}}',
  agentMessages: '{{agent.messages}}',
  agentIntent: '{{agent.intent}}',
  agentOutcome: '{{agent.outcome}}',
  messageText: '{{message.text}}',
  userName: '{{user.name}}',
  channelVar: '{{channel}}',
  historyVar: '{{history}}',
  todayVar: '{{today}}',
  silentMinutes: '{{inactivity.silent_minutes}}',
  attemptVar: '{{inactivity.attempt}}',
  apiStatus: '{{lookup.status}}',
  apiBody: '{{lookup.body}}',
  openBraces: '{{',
};
