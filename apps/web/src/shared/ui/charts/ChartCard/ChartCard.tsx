import clsx from 'clsx';
import { useId } from 'react';
import type { ChartCardProps } from '@/shared/ui/charts/ChartCard/ChartCard.typedefs';
import { Card, CardGap, CardPad } from '@/shared/ui/display/Card';
import { HeadingElement } from '@/shared/ui/typography/Heading';
import styles from '@/shared/ui/charts/ChartCard/ChartCard.module.scss';

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
