import type {
  TableCellLeadKind,
  TableCellLeadSize,
} from '@/shared/ui/data/TableCellLead/TableCellLead.constants';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

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
