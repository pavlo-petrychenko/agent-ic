import { NodeType } from '@agent-ic/flow';
import type { NodePresentation } from '@/features/flow-builder/typedefs/nodePresentation.typedefs';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export const NODE_PRESENTATION: Readonly<Record<NodeType, NodePresentation>> = {
  [NodeType.TriggerMessage]: { kind: NodeKind.Trig, icon: IconName.Msg },
  [NodeType.TriggerExternalEvent]: { kind: NodeKind.Trig, icon: IconName.Bolt },
  [NodeType.TriggerSchedule]: { kind: NodeKind.Trig, icon: IconName.Cal },
  [NodeType.Agent]: { kind: NodeKind.Agent, icon: IconName.Agent },
  [NodeType.Completion]: { kind: NodeKind.Compl, icon: IconName.Compl },
  [NodeType.Router]: { kind: NodeKind.Router, icon: IconName.Router },
  [NodeType.Parallel]: { kind: NodeKind.Par, icon: IconName.Par },
  [NodeType.ApiRequest]: { kind: NodeKind.Api, icon: IconName.Api },
  [NodeType.SendMessage]: { kind: NodeKind.Send, icon: IconName.Send },
  [NodeType.Escalation]: { kind: NodeKind.Esc, icon: IconName.Esc },
};
