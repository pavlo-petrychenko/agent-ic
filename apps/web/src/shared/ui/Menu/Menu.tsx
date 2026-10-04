import clsx from 'clsx';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { MENU_CHECK_ICON_SIZE } from '@/shared/ui/Menu/Menu.constants';
import type { MenuItem, MenuProps } from '@/shared/ui/Menu/Menu.typedefs';
import { useMenuNavigation } from '@/shared/ui/Menu/useMenuNavigation';
import styles from '@/shared/ui/Menu/Menu.module.scss';

function renderRow(item: MenuItem, selected: boolean) {
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

export function Menu({
  items,
  selectedId = null,
  onSelect,
  width = null,
  ariaLabel,
  className,
}: MenuProps) {
  const { tabStopId, registerOption, handleKeyDown, handleFocus, selectItem } = useMenuNavigation({
    items,
    selectedId,
    onSelect,
  });

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="listbox"
      aria-label={ariaLabel}
      className={clsx(styles.root, className)}
      style={width === null ? undefined : { width }}
    >
      {items.map((item, index) => {
        const selected = item.id === selectedId;
        const disabled = item.disabled === true;

        return (
          <div
            key={item.id}
            ref={registerOption(item.id)}
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="option"
            aria-selected={selected}
            aria-disabled={disabled ? true : undefined}
            tabIndex={item.id === tabStopId ? 0 : -1}
            className={clsx(
              styles.option,
              (item.leading ?? null) !== null && styles.rich,
              disabled && styles.disabled,
            )}
            onClick={() => selectItem(item)}
            onFocus={() => handleFocus(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {renderRow(item, selected)}
          </div>
        );
      })}
    </div>
  );
}
