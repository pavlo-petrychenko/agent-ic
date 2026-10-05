import clsx from 'clsx';
import { Badge } from '@/shared/ui/display/Badge';
import { SOURCE_BADGE_TONE } from '@/shared/ui/display/SourceBadges/SourceBadges.constants';
import type { SourceBadgesProps } from '@/shared/ui/display/SourceBadges/SourceBadges.typedefs';
import styles from '@/shared/ui/display/SourceBadges/SourceBadges.module.scss';

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
