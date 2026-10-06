import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface NodeHeaderProps {
  kind: NodeKind;
  overline: string;
  name: string;
  icon?: IconName | null;
  invalidLabel?: string | null;
  className?: string;
}
