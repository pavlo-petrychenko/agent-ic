import { useId } from 'react';
import { ATTENTION_CARD_LOADING_LINES } from '@/shared/ui/display/AttentionCard/AttentionCard.constants';
import type { AttentionCardProps } from '@/shared/ui/display/AttentionCard/AttentionCard.typedefs';
import { Card } from '@/shared/ui/display/Card/Card';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { Notice } from '@/shared/ui/display/Notice/Notice';
import { Skeleton } from '@/shared/ui/display/Skeleton/Skeleton';
import { Heading } from '@/shared/ui/typography/Heading/Heading';
import { HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading/Heading.constants';
import styles from '@/shared/ui/display/AttentionCard/AttentionCard.module.scss';

export function AttentionCard({ title, rows, loading = false, ...rest }: AttentionCardProps) {
  const titleId = useId();

  if (!loading && rows.length === 0) {
    return null;
  }

  return (
    <Card {...rest} flush aria-labelledby={titleId}>
      <Heading id={titleId} size={HeadingSize.H3} as={HeadingElement.H2} className={styles.title}>
        {title}
      </Heading>
      {loading ? (
        <Skeleton label={title} lines={ATTENTION_CARD_LOADING_LINES} className={styles.loading} />
      ) : (
        <ul className={styles.rows}>
          {rows.map((row) => (
            <Notice
              key={row.id}
              icon={row.icon}
              tone={row.tone ?? NodeKind.Info}
              title={row.title}
              meta={row.meta ?? null}
              action={row.action ?? null}
              className={styles.row}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
