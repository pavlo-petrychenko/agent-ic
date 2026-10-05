import clsx from 'clsx';
import { useId } from 'react';
import { Avatar, AvatarSize, AvatarTone } from '@/shared/ui/Avatar';
import { CountBadge } from '@/shared/ui/CountBadge';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { IconButton, IconButtonSize } from '@/shared/ui/IconButton';
import { NavItem } from '@/shared/ui/NavItem';
import type { NavItemData } from '@/shared/ui/NavItem';
import { NavSectionLabel } from '@/shared/ui/NavSectionLabel';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/SegmentedControl';
import { SIDEBAR_GROUP_ID_SEPARATOR } from '@/shared/ui/Sidebar/Sidebar.constants';
import type { SidebarProps } from '@/shared/ui/Sidebar/Sidebar.typedefs';
import { WorkspaceSwitcher } from '@/shared/ui/WorkspaceSwitcher';
import styles from '@/shared/ui/Sidebar/Sidebar.module.scss';

function renderItems(items: readonly NavItemData[], labelledBy: string | null) {
  return (
    <ul aria-labelledby={labelledBy ?? undefined} className={styles.list}>
      {items.map((item) => (
        <li key={item.id}>
          <NavItem
            to={item.to}
            icon={item.icon}
            disabled={item.disabled}
            meta={
              item.badgeCount === null ? null : (
                <>
                  <CountBadge
                    count={item.badgeCount}
                    aria-hidden={item.badgeLabel === null ? undefined : true}
                  />
                  {item.badgeLabel !== null && (
                    <span className={styles.visuallyHidden}>{item.badgeLabel}</span>
                  )}
                </>
              )
            }
          >
            {item.label}
          </NavItem>
        </li>
      ))}
    </ul>
  );
}

export function Sidebar({
  workspaceSwitcher,
  groups,
  footerItems,
  user,
  language,
  onCollapse,
  collapseLabel,
  ariaLabel,
  className,
}: SidebarProps) {
  const baseId = useId();

  return (
    <nav aria-label={ariaLabel} className={clsx(styles.root, className)}>
      <div className={styles.header}>
        <WorkspaceSwitcher {...workspaceSwitcher} />
        <IconButton
          icon={IconName.Panel}
          label={collapseLabel}
          size={IconButtonSize.Sm}
          onClick={onCollapse}
        />
      </div>
      {groups.map((group) => {
        const labelId =
          group.label === null ? null : `${baseId}${SIDEBAR_GROUP_ID_SEPARATOR}${group.id}`;

        return (
          <div key={group.id} className={styles.group}>
            {group.label !== null && labelId !== null && (
              <NavSectionLabel label={group.label} id={labelId} />
            )}
            {renderItems(group.items, labelId)}
          </div>
        );
      })}
      {footerItems.length > 0 && (
        <div className={clsx(styles.group, styles.bottom)}>{renderItems(footerItems, null)}</div>
      )}
      {(user !== null || language !== null) && (
        <div className={styles.footer}>
          {user !== null && (
            <div className={styles.user}>
              <Avatar initials={user.initials} size={AvatarSize.Sm} tone={AvatarTone.Accent} />
              <span className={styles.userText}>
                <span className={styles.userName}>{user.name}</span>
                {user.roleLabel !== null && (
                  <span className={styles.userRole}>{user.roleLabel}</span>
                )}
              </span>
            </div>
          )}
          {language !== null && (
            <SegmentedControl
              options={language.options}
              value={language.value}
              onValueChange={language.onValueChange}
              ariaLabel={language.ariaLabel}
              size={SegmentedControlSize.Sm}
            />
          )}
        </div>
      )}
    </nav>
  );
}
