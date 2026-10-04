import {
  ACCOUNT_ICON_SIZE,
  ACCOUNT_MENU_WIDTH,
  AccountAction,
} from '@/features/workspace/constants/accountMenu.constants';
import { WorkspaceIdentity } from '@/features/workspace/view/WorkspaceIdentity';
import type { WorkspaceSwitcherProps } from '@/features/workspace/view/WorkspaceSwitcher/WorkspaceSwitcher.typedefs';
import { Avatar, AvatarSize, AvatarTone } from '@/shared/ui/Avatar';
import { Icon, IconName } from '@/shared/ui/Icon';
import { Menu, MenuVariant } from '@/shared/ui/Menu';
import { Popover } from '@/shared/ui/Popover';
import styles from '@/features/workspace/view/WorkspaceSwitcher/WorkspaceSwitcher.module.scss';

export function WorkspaceSwitcher({
  open,
  onOpenChange,
  activeId,
  activeName,
  workspaces,
  labels,
  onSelectWorkspace,
  onCreateWorkspace,
  onLogOut,
}: WorkspaceSwitcherProps) {
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      bare
      trigger={
        <button type="button" className={styles.trigger}>
          <WorkspaceIdentity name={activeName} caption={labels.caption} expandable />
        </button>
      }
    >
      <div className={styles.menus}>
        <Menu
          ariaLabel={labels.workspaces}
          width={ACCOUNT_MENU_WIDTH}
          selectedId={activeId}
          onSelect={onSelectWorkspace}
          items={workspaces.map((workspace) => ({
            id: workspace.id,
            label: workspace.name,
            hint: workspace.hint,
            leading: (
              <Avatar
                initials={workspace.initials}
                size={AvatarSize.Sm}
                tone={workspace.id === activeId ? AvatarTone.Solid : AvatarTone.Neutral}
              />
            ),
          }))}
        />
        <Menu
          ariaLabel={labels.account}
          variant={MenuVariant.Action}
          width={ACCOUNT_MENU_WIDTH}
          onSelect={(id) => (id === AccountAction.LogOut ? onLogOut() : onCreateWorkspace())}
          items={[
            {
              id: AccountAction.CreateWorkspace,
              label: labels.createWorkspace,
              leading: <Icon name={IconName.Plus} size={ACCOUNT_ICON_SIZE} />,
            },
            {
              id: AccountAction.LogOut,
              label: labels.logOut,
              leading: <Icon name={IconName.X} size={ACCOUNT_ICON_SIZE} />,
            },
          ]}
        />
      </div>
    </Popover>
  );
}
