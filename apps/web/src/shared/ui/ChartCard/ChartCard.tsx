import clsx from 'clsx';
import { useId } from 'react';
import { Card, CardGap, CardPad } from '@/shared/ui/Card';
import type { ChartCardProps } from '@/shared/ui/ChartCard/ChartCard.typedefs';
import { HeadingElement } from '@/shared/ui/Heading';
import styles from '@/shared/ui/ChartCard/ChartCard.module.scss';

export function ChartCard({
  title,
  meta = null,
  legend = null,
  headingAs = HeadingElement.H3,
  className,
  children,
  ...rest
}: ChartCardProps) {
  const titleId = useId();
  const Title = headingAs;

  return (
    <Card
      {...rest}
      pad={CardPad.Lg}
      gap={legend === null ? CardGap.Md : CardGap.Lg}
      aria-labelledby={titleId}
      className={clsx(styles.root, className)}
    >
      <header className={styles.header}>
        <Title id={titleId} className={styles.title}>
          {title}
        </Title>
        {meta !== null && <div className={styles.meta}>{meta}</div>}
      </header>
      {legend}
      <div className={styles.body}>{children}</div>
    </Card>
  );
}
