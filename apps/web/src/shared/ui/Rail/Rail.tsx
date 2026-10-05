import clsx from 'clsx';
import { Divider } from '@/shared/ui/Divider';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { IconButton, IconButtonSize } from '@/shared/ui/IconButton';
import { NavItem, NavItemLayout } from '@/shared/ui/NavItem';
import type { NavItemData } from '@/shared/ui/NavItem';
import { RAIL_NAME_SEPARATOR, RAIL_TOOLTIP_COUNT_SEPARATOR } from '@/shared/ui/Rail/Rail.constants';
import type { RailProps } from '@/shared/ui/Rail/Rail.typedefs';
import styles from '@/shared/ui/Rail/Rail.module.scss';

const hasUnread = (item: NavItemData): boolean => item.badgeCount !== null && item.badgeCount > 0;

const getRailItemTooltip = (item: NavItemData): string =>
  item.badgeCount !== null && hasUnread(item)
    ? `${item.label}${RAIL_TOOLTIP_COUNT_SEPARATOR}${item.badgeCount}`
    : item.label;

const getRailItemName = (item: NavItemData): string =>
  item.badgeLabel !== null && hasUnread(item)
    ? `${item.label}${RAIL_NAME_SEPARATOR}${item.badgeLabel}`
    : item.label;

function renderRailItems(items: readonly NavItemData[]) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id}>
          <NavItem
            to={item.to}
            icon={item.icon}
            layout={NavItemLayout.Rail}
            disabled={item.disabled}
            tooltip={getRailItemTooltip(item)}
            meta={hasUnread(item) ? <span aria-hidden="true" className={styles.unread} /> : null}
          >
            {getRailItemName(item)}
          </NavItem>
        </li>
      ))}
    </ul>
  );
}

export function Rail({
  logo,
  groups,
  footerItems,
  ariaLabel,
  expand = null,
  account = null,
  className,
}: RailProps) {
  const hasFooter = footerItems.length > 0 || account !== null;

  return (
    <nav aria-label={ariaLabel} className={clsx(styles.root, className)}>
      <div className={styles.logo}>{logo}</div>
      {expand !== null && (
        <IconButton
          icon={IconName.Panel}
          label={expand.label}
          size={IconButtonSize.Sm}
          onClick={expand.onClick}
        />
      )}
      {groups.map((group, index) => (
        <div key={group.map((item) => item.id).join()} className={styles.group}>
          {renderRailItems(group)}
          {(hasFooter || index < groups.length - 1) && <Divider className={styles.divider} />}
        </div>
      ))}
      {hasFooter && (
        <div className={styles.footer}>
          {renderRailItems(footerItems)}
          {account !== null && <div className={styles.account}>{account}</div>}
        </div>
      )}
    </nav>
  );
}
