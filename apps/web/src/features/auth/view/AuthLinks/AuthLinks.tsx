import type { AuthLinksProps } from '@/features/auth/view/AuthLinks/AuthLinks.typedefs';
import styles from '@/features/auth/view/AuthLinks/AuthLinks.module.scss';

export function AuthLinks({ children }: AuthLinksProps) {
  return <nav className={styles.root}>{children}</nav>;
}
