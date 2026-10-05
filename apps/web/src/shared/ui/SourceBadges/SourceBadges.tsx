import clsx from 'clsx';
import { Badge } from '@/shared/ui/Badge';
import { SOURCE_BADGE_TONE } from '@/shared/ui/SourceBadges/SourceBadges.constants';
import type { SourceBadgesProps } from '@/shared/ui/SourceBadges/SourceBadges.typedefs';
import styles from '@/shared/ui/SourceBadges/SourceBadges.module.scss';

export function SourceBadges({ sources, ariaLabel = null, className }: SourceBadgesProps) {
  return (
    <ul aria-label={ariaLabel ?? undefined} className={clsx(styles.root, className)}>
      {sources.map((source) => (
        <li key={source.kind} className={styles.item}>
          <Badge tone={SOURCE_BADGE_TONE[source.kind]}>{source.label}</Badge>
        </li>
      ))}
    </ul>
  );
}
