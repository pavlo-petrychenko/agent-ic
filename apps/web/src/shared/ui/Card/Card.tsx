import { useId } from 'react';
import type { CardProps } from '@/shared/ui/Card/Card.typedefs';
import styles from '@/shared/ui/Card/Card.module.scss';

export function Card({ title = null, children }: CardProps) {
  const titleId = useId();

  return (
    <section className={styles.root} aria-labelledby={title === null ? undefined : titleId}>
      {title === null ? null : (
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
