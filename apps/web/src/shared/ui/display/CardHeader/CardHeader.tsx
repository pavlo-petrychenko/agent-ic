import clsx from 'clsx';
import { createElement } from 'react';
import {
  CARD_HEADER_ELEMENTS,
  CardHeaderLevel,
} from '@/shared/ui/display/CardHeader/CardHeader.constants';
import type { CardHeaderProps } from '@/shared/ui/display/CardHeader/CardHeader.typedefs';
import { Heading, HeadingSize } from '@/shared/ui/typography/Heading';
import styles from '@/shared/ui/display/CardHeader/CardHeader.module.scss';

export function CardHeader({
  title,
  sub = null,
  right = null,
  tag = null,
  headingLevel = CardHeaderLevel.H3,
  className,
  ...rest
}: CardHeaderProps) {
  const hasSub = sub !== null;
  const element = CARD_HEADER_ELEMENTS[headingLevel];

  return (
    <div {...rest} className={clsx(styles.root, hasSub && styles.withSub, className)}>
      <div className={styles.left}>
        <div className={styles.titleRow}>
          {hasSub ? (
            <Heading size={HeadingSize.H3} as={element}>
              {title}
            </Heading>
          ) : (
            createElement(element, { className: styles.title }, title)
          )}
          {tag}
        </div>
        {hasSub && <p className={styles.sub}>{sub}</p>}
      </div>
      {right !== null && <div className={styles.right}>{right}</div>}
    </div>
  );
}
