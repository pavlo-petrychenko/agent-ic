import clsx from 'clsx';
import {
  NavGroupKey,
  WORKSPACE_SECTION_PATHS,
} from '@/features/workspace/constants/navigation.constants';
import type { WorkspaceSidebarProps } from '@/features/workspace/view/WorkspaceSidebar/WorkspaceSidebar.typedefs';
import { Avatar, AvatarSize, AvatarTone } from '@/shared/ui/Avatar';
import { NavGroup } from '@/shared/ui/NavGroup';
import { NavItem } from '@/shared/ui/NavItem';
import styles from '@/features/workspace/view/WorkspaceSidebar/WorkspaceSidebar.module.scss';

export function WorkspaceSidebar({
  workspaceId,
  navLabel,
  header,
  groups,
  user,
  footerAction,
}: WorkspaceSidebarProps) {
  return (
    <nav aria-label={navLabel} className={styles.root}>
      <div className={styles.header}>{header}</div>
      {groups.map((group) => (
        <NavGroup
          key={group.key}
          label={group.label}
          className={clsx(group.key === NavGroupKey.Footer && styles.pushDown)}
        >
          {group.items.map((item) => (
            <NavItem
              key={item.section}
              to={WORKSPACE_SECTION_PATHS[item.section]}
              params={{ workspaceId }}
              icon={item.icon}
            >
              {item.label}
            </NavItem>
          ))}
        </NavGroup>
      ))}
      <div className={styles.footer}>
        {user !== null && (
          <div className={styles.user}>
            <Avatar initials={user.initials} size={AvatarSize.Sm} tone={AvatarTone.Accent} />
            <span className={styles.userText}>
              <span className={styles.userName}>{user.name}</span>
              {user.roleLabel !== null && <span className={styles.userRole}>{user.roleLabel}</span>}
            </span>
          </div>
        )}
        {footerAction}
      </div>
    </nav>
  );
}
