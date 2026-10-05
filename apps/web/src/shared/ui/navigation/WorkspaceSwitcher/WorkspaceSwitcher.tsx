import clsx from 'clsx';
import { useState } from 'react';
import { Avatar, AvatarSize } from '@/shared/ui/display/Avatar';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { Divider } from '@/shared/ui/layout/Divider';
import {
  WORKSPACE_SWITCHER_CHEVRON_SIZE,
  WORKSPACE_SWITCHER_DETAIL_SEPARATOR,
  WORKSPACE_SWITCHER_INITIALS_LIMIT,
  WORKSPACE_SWITCHER_LOGO_ICON_SIZE,
  WORKSPACE_SWITCHER_LOGO_STROKE_WIDTH,
  WORKSPACE_SWITCHER_WORD_PATTERN,
} from '@/shared/ui/navigation/WorkspaceSwitcher/WorkspaceSwitcher.constants';
import type {
  WorkspaceSwitcherAccountEntry,
  WorkspaceSwitcherOption,
  WorkspaceSwitcherProps,
} from '@/shared/ui/navigation/WorkspaceSwitcher/WorkspaceSwitcher.typedefs';
import { Menu, MenuEntryKind, MenuVariant } from '@/shared/ui/overlays/Menu';
import type { MenuItem } from '@/shared/ui/overlays/Menu';
import { Popover, PopoverAlign } from '@/shared/ui/overlays/Popover';
import styles from '@/shared/ui/navigation/WorkspaceSwitcher/WorkspaceSwitcher.module.scss';

const getWorkspaceInitials = (name: string): string =>
  name
    .trim()
    .split(WORKSPACE_SWITCHER_WORD_PATTERN)
    .slice(0, WORKSPACE_SWITCHER_INITIALS_LIMIT)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

const getWorkspaceDetail = (
  option: WorkspaceSwitcherOption,
  formatMemberCount: (count: number) => string,
): string =>
  `${option.roleLabel}${WORKSPACE_SWITCHER_DETAIL_SEPARATOR}${formatMemberCount(option.memberCount)}`;

const shouldKeepAccountMenuOpen = (
  entries: readonly WorkspaceSwitcherAccountEntry[],
  id: string,
): boolean =>
  entries.some(
    (entry) =>
      entry.id === id &&
      (entry.kind === undefined || entry.kind === MenuEntryKind.Option) &&
      entry.keepOpen === true,
  );

export function WorkspaceSwitcher({
  current,
  options,
  onSelect,
  menuLabel,
  workspacesLabel,
  accountLabel,
  formatMemberCount,
  accountItems = [],
  onAccountSelect = null,
  defaultOpen = false,
  className,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(defaultOpen);

  const workspaceItems: readonly MenuItem[] = options.map((option) => ({
    id: option.id,
    label: option.name,
    hint: getWorkspaceDetail(option, formatMemberCount),
    leading: <Avatar initials={getWorkspaceInitials(option.name)} size={AvatarSize.Sm} />,
  }));

  const handleWorkspaceSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  const handleAccountSelect = (id: string) => {
    onAccountSelect?.(id);
    if (!shouldKeepAccountMenuOpen(accountItems, id)) {
      setOpen(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align={PopoverAlign.Start}
      bare
      ariaLabel={menuLabel}
      trigger={
        <button type="button" className={clsx(styles.trigger, className)}>
          <span className={styles.logo}>
            <Icon
              name={IconName.Logo}
              size={WORKSPACE_SWITCHER_LOGO_ICON_SIZE}
              strokeWidth={WORKSPACE_SWITCHER_LOGO_STROKE_WIDTH}
            />
          </span>
          <span className={styles.text}>
            <span className={styles.name}>{current.name}</span>
            <span className={styles.role}>{current.roleLabel}</span>
          </span>
          <Icon name={IconName.ChevronDown} size={WORKSPACE_SWITCHER_CHEVRON_SIZE} />
        </button>
      }
    >
      <div className={styles.surface}>
        {workspaceItems.length > 0 && (
          <Menu
            items={workspaceItems}
            selectedId={current.id}
            onSelect={handleWorkspaceSelect}
            ariaLabel={workspacesLabel}
            className={styles.menu}
          />
        )}
        {workspaceItems.length > 0 && accountItems.length > 0 && (
          <Divider className={styles.divider} />
        )}
        {accountItems.length > 0 && (
          <Menu
            items={accountItems}
            variant={MenuVariant.Action}
            onSelect={handleAccountSelect}
            ariaLabel={accountLabel}
            className={styles.menu}
          />
        )}
      </div>
    </Popover>
  );
}
