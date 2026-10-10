import clsx from 'clsx';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import {
  MENU_CHECK_ICON_SIZE,
  MENU_ITEM_ROLES,
  MenuEntryKind,
  MenuRole,
  MenuVariant,
} from '@/shared/ui/overlays/Menu/Menu.constants';
import type { MenuEntry, MenuItem, MenuProps } from '@/shared/ui/overlays/Menu/Menu.typedefs';
import { useMenuNavigation } from '@/shared/ui/overlays/Menu/useMenuNavigation';
import styles from '@/shared/ui/overlays/Menu/Menu.module.scss';

const isMenuItem = (entry: MenuEntry): entry is MenuItem =>
  entry.kind === undefined || entry.kind === MenuEntryKind.Option;

function renderListboxRow(item: MenuItem, selected: boolean) {
  const leading = item.leading ?? null;
  const hint = item.hint ?? null;
  const trailing = item.trailing ?? null;
  const labelClass = clsx(styles.label, item.mono === true && styles.mono);

  if (leading === null) {
    return (
      <>
        <span className={labelClass}>{item.label}</span>
        {hint === null ? null : <span className={styles.hint}>{hint}</span>}
        {trailing}
      </>
    );
  }

  return (
    <>
      <span className={styles.leading}>{leading}</span>
      <span className={styles.text}>
        <span className={clsx(labelClass, styles.title)}>{item.label}</span>
        {hint === null ? null : <span className={styles.subtitle}>{hint}</span>}
      </span>
      {trailing ?? (selected ? <Icon name={IconName.Check} size={MENU_CHECK_ICON_SIZE} /> : null)}
    </>
  );
}

function renderActionRow(item: MenuItem, selected: boolean) {
  const leading = selected ? (
    <Icon name={IconName.Check} size={MENU_CHECK_ICON_SIZE} />
  ) : (
    (item.leading ?? null)
  );
  const hint = item.hint ?? null;
  const shortcut = item.shortcut ?? null;
  const trailing = item.trailing ?? null;
  const labelClass = clsx(styles.label, item.mono === true && styles.mono);

  return (
    <>
      {leading === null ? null : <span className={styles.leading}>{leading}</span>}
      <span className={labelClass}>{item.label}</span>
      {hint === null ? null : <span className={styles.hint}>{hint}</span>}
      {shortcut === null ? null : <span className={styles.shortcut}>{shortcut}</span>}
      {trailing}
    </>
  );
}

export function Menu({
  items,
  selectedId = null,
  onSelect,
  variant = MenuVariant.Listbox,
  role = MenuRole.Listbox,
  width = null,
  minWidth = null,
  ariaLabel,
  className,
}: MenuProps) {
  const options = items.filter(isMenuItem);
  const { tabStopId, registerOption, handleKeyDown, handleFocus, selectItem } = useMenuNavigation({
    items: options,
    selectedId,
    onSelect,
  });
  const isAction = variant === MenuVariant.Action;
  const isListbox = role === MenuRole.Listbox;

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role={role}
      aria-label={ariaLabel}
      className={clsx(styles.root, minWidth !== null && styles.fit, className)}
      style={{ width: width ?? undefined, minWidth: minWidth ?? undefined }}
    >
      {items.map((entry) => {
        if (entry.kind === MenuEntryKind.Section) {
          return (
            <div key={entry.id} role="presentation" className={styles.section}>
              {entry.label}
            </div>
          );
        }
        if (entry.kind === MenuEntryKind.Separator) {
          return <div key={entry.id} aria-hidden="true" className={styles.separator} />;
        }

        const selected = entry.id === selectedId;
        const disabled = entry.disabled === true;

        return (
          // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
          <div
            key={entry.id}
            ref={registerOption(entry.id)}
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role={MENU_ITEM_ROLES[role]}
            aria-selected={isListbox ? selected : undefined}
            aria-disabled={disabled ? true : undefined}
            tabIndex={entry.id === tabStopId ? 0 : -1}
            className={clsx(
              styles.option,
              isAction ? styles.action : (entry.leading ?? null) !== null && styles.rich,
              entry.danger === true && styles.danger,
              disabled && styles.disabled,
            )}
            onClick={() => selectItem(entry)}
            onFocus={() => handleFocus(entry.id)}
            onKeyDown={(event) => handleKeyDown(event, options.indexOf(entry))}
          >
            {isAction ? renderActionRow(entry, selected) : renderListboxRow(entry, selected)}
          </div>
        );
      })}
    </div>
  );
}
