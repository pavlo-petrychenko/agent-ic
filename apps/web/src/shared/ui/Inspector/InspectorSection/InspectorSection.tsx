import clsx from 'clsx';
import { useId } from 'react';
import type { InspectorSectionProps } from '@/shared/ui/Inspector/InspectorSection/InspectorSection.typedefs';
import styles from '@/shared/ui/Inspector/InspectorSection/InspectorSection.module.scss';

export function InspectorSection({
  title,
  note = null,
  className,
  children,
  ...rest
}: InspectorSectionProps) {
  const titleId = useId();

  return (
    <section {...rest} aria-labelledby={titleId} className={clsx(styles.root, className)}>
      <div className={styles.head}>
        <h3 id={titleId} className={styles.title}>
          {title}
        </h3>
        {note !== null && <span className={styles.note}>{note}</span>}
      </div>
      {children}
    </section>
  );
}
