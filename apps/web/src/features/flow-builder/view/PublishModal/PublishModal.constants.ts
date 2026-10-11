import { CheckTone } from '@/features/flow-builder/constants/publish.constants';
import { NodeKind } from '@/shared/ui/display/NodeTile';
import { IconName } from '@/shared/ui/foundations/Icon';

export const CHECK_TILE: Readonly<Record<CheckTone, { kind: NodeKind; icon: IconName }>> = {
  [CheckTone.Ok]: { kind: NodeKind.Ok, icon: IconName.Check },
  [CheckTone.Warn]: { kind: NodeKind.Warn, icon: IconName.Alert },
  [CheckTone.Err]: { kind: NodeKind.Err, icon: IconName.Alert },
};

export const NOTE_ROWS = 3;
