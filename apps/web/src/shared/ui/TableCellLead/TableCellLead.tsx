import clsx from 'clsx';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import { NodeTile } from '@/shared/ui/NodeTile/NodeTile';
import {
  TABLE_CELL_LEAD_AVATAR_SIZES,
  TABLE_CELL_LEAD_TILE_SIZES,
  TableCellLeadKind,
  TableCellLeadSize,
} from '@/shared/ui/TableCellLead/TableCellLead.constants';
import type {
  TableCellLeadProps,
  TableCellLeadVisual,
} from '@/shared/ui/TableCellLead/TableCellLead.typedefs';
import styles from '@/shared/ui/TableCellLead/TableCellLead.module.scss';

function LeadVisual({ lead, size }: { lead: TableCellLeadVisual; size: TableCellLeadSize }) {
  if (lead.kind === TableCellLeadKind.Avatar) {
    return (
      <Avatar
        initials={lead.initials}
        src={lead.src ?? null}
        size={TABLE_CELL_LEAD_AVATAR_SIZES[size]}
        className={styles.lead}
      />
    );
  }

  return (
    <NodeTile
      aria-hidden="true"
      kind={lead.tone}
      icon={lead.icon ?? null}
      size={TABLE_CELL_LEAD_TILE_SIZES[size]}
      className={styles.lead}
    />
  );
}

export function TableCellLead({
  title,
  lead,
  subtitle = null,
  size = TableCellLeadSize.Lg,
  className,
}: TableCellLeadProps) {
  return (
    <span className={clsx(styles.root, className)}>
      <LeadVisual lead={lead} size={size} />
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {subtitle !== null && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
    </span>
  );
}
