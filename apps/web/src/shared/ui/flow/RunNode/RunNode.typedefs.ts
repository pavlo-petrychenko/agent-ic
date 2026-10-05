import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { RunNodeState } from '@/shared/ui/flow/RunNode/RunNode.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface RunNodeProps {
  name: string;
  kind: NodeKind;
  state: RunNodeState;
  stateLabel: string;
  icon?: IconName | null;
  className?: string;
}
