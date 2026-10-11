import type { DangerZoneCardProps } from '@/features/settings/view/DangerZoneCard/DangerZoneCard.typedefs';
import { DangerZoneRow } from '@/features/settings/view/DangerZoneCard/DangerZoneRow';
import { Card } from '@/shared/ui/display/Card';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import styles from '@/features/settings/view/DangerZoneCard/DangerZoneCard.module.scss';

export function DangerZoneCard({ title, rows }: DangerZoneCardProps) {
  return (
    <Card flush>
      <Heading size={HeadingSize.H3} as={HeadingElement.H3} className={styles.header}>
        {title}
      </Heading>
      <ul className={styles.rows}>
        {rows.map((row) => (
          <DangerZoneRow key={row.id} row={row} />
        ))}
      </ul>
    </Card>
  );
}
