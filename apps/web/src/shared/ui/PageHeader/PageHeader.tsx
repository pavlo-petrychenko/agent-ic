import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/Heading';
import type { PageHeaderProps } from '@/shared/ui/PageHeader/PageHeader.typedefs';
import styles from '@/shared/ui/PageHeader/PageHeader.module.scss';

export function PageHeader({
  title,
  subtitle = null,
  crumbs = null,
  actions = null,
}: PageHeaderProps) {
  return (
    <header className={styles.root}>
      <div className={styles.text}>
        {crumbs}
        <Heading size={HeadingSize.H1} as={HeadingElement.H1}>
          {title}
        </Heading>
        {subtitle !== null && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions !== null && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
