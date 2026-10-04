import { createLink, type LinkComponent } from '@tanstack/react-router';
import clsx from 'clsx';
import { Icon } from '@/shared/ui/Icon/Icon';
import { NAV_ITEM_ICON_SIZE } from '@/shared/ui/NavItem/NavItem.constants';
import type { NavItemAnchorProps } from '@/shared/ui/NavItem/NavItem.typedefs';
import styles from '@/shared/ui/NavItem/NavItem.module.scss';

function NavAnchor({ icon = null, meta = null, className, children, ...rest }: NavItemAnchorProps) {
  return (
    <a {...rest} className={clsx(styles.root, className)}>
      {icon !== null && (
        <span className={styles.icon}>
          <Icon name={icon} size={NAV_ITEM_ICON_SIZE} />
        </span>
      )}
      <span className={styles.label}>{children}</span>
      {meta !== null && <span className={styles.meta}>{meta}</span>}
    </a>
  );
}

const RouterNavAnchor = createLink(NavAnchor);

export const NavItem: LinkComponent<typeof NavAnchor> = (props) => (
  <RouterNavAnchor preload="intent" {...props} />
);
