import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';
import type {
  TableCellLeadKind,
  TableCellLeadSize,
} from '@/shared/ui/TableCellLead/TableCellLead.constants';

export interface TableCellLeadIcon {
  kind: TableCellLeadKind.Icon;
  tone: NodeKind;
  icon?: IconName | null;
}

export interface TableCellLeadAvatar {
  kind: TableCellLeadKind.Avatar;
  initials: string;
  src?: string | null;
}

export type TableCellLeadVisual = TableCellLeadIcon | TableCellLeadAvatar;

export interface TableCellLeadProps {
  title: string;
  lead: TableCellLeadVisual;
  subtitle?: string | null;
  size?: TableCellLeadSize;
  className?: string;
}
