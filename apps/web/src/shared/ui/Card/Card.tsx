import clsx from 'clsx';
import { useId } from 'react';
import {
  CARD_DEFAULT_GAP,
  CARD_DEFAULT_PAD,
  CardElement,
  CardTone,
} from '@/shared/ui/Card/Card.constants';
import type { CardProps } from '@/shared/ui/Card/Card.typedefs';
import { Heading } from '@/shared/ui/Heading/Heading';
import { HeadingElement, HeadingSize } from '@/shared/ui/Heading/Heading.constants';
import styles from '@/shared/ui/Card/Card.module.scss';

export function Card({
  title = null,
  tone = CardTone.Default,
  pad = null,
  gap = null,
  selected = false,
  flush = false,
  as = CardElement.Section,
  className,
  children,
  ...rest
}: CardProps) {
  const titleId = useId();
  const Tag = as;
  const labelled = title !== null;

  return (
    <Tag
      {...rest}
      aria-labelledby={labelled ? titleId : rest['aria-labelledby']}
      aria-current={selected ? 'true' : rest['aria-current']}
      className={clsx(
        styles.root,
        styles[tone],
        styles[`pad-${pad ?? CARD_DEFAULT_PAD[tone]}`],
        styles[`gap-${gap ?? CARD_DEFAULT_GAP[tone]}`],
        selected && styles.selected,
        flush && styles.flush,
        className,
      )}
    >
      {labelled && (
        <Heading id={titleId} size={HeadingSize.H3} as={HeadingElement.H2}>
          {title}
        </Heading>
      )}
      {children}
    </Tag>
  );
}
