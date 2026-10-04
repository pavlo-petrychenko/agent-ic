import { useId } from 'react';

import styles from './Card.module.scss';
import type { CardProps } from './Card.typedefs';

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
