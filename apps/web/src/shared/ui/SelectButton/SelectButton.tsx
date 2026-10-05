import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { Icon, IconName } from '@/shared/ui/Icon';
import { Menu } from '@/shared/ui/Menu';
import { Popover } from '@/shared/ui/Popover';
import {
  SELECT_BUTTON_CHEVRON_SIZE,
  SELECT_BUTTON_ERROR_ID_SUFFIX,
  SELECT_BUTTON_FOCUS_TARGET,
  SELECT_BUTTON_LISTBOX_POPUP,
} from '@/shared/ui/SelectButton/SelectButton.constants';
import type { SelectButtonProps } from '@/shared/ui/SelectButton/SelectButton.typedefs';
import styles from '@/shared/ui/SelectButton/SelectButton.module.scss';

export function SelectButton({
  value,
  context = null,
  label = null,
  icon = null,
  mono = false,
  invalid = false,
  error = null,
  disabled = false,
  open = null,
  onOpenChange = null,
  options = null,
  selectedId = null,
  onSelect = null,
  menuLabel = null,
  className,
  onClick,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: SelectButtonProps) {
  const errorId = `${useId()}${SELECT_BUTTON_ERROR_ID_SUFFIX}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuHostRef = useRef<HTMLDivElement>(null);
  const [ownOpen, setOwnOpen] = useState(false);
  const [menuWidth, setMenuWidth] = useState<number | null>(null);
  const picker = options !== null;
  const isOpen = open ?? ownOpen;
  const hasError = error !== null;
  const showInvalid = invalid || hasError;
  const describedBy = [hasError ? errorId : null, ariaDescribedBy]
    .filter((id) => id !== null && id !== undefined)
    .join(' ');

  useEffect(() => {
    if (picker && isOpen) {
      menuHostRef.current?.querySelector<HTMLElement>(SELECT_BUTTON_FOCUS_TARGET)?.focus();
    }
  }, [picker, isOpen]);

  const changeOpen = (next: boolean) => {
    if (next) {
      const width = triggerRef.current?.getBoundingClientRect().width ?? 0;
      setMenuWidth(width > 0 ? width : null);
    }
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  const trigger = (
    <button
      {...rest}
      ref={triggerRef}
      type="button"
      disabled={disabled}
      aria-haspopup={SELECT_BUTTON_LISTBOX_POPUP}
      aria-expanded={isOpen}
      aria-describedby={describedBy === '' ? undefined : describedBy}
      className={clsx(styles.trigger, showInvalid && styles.invalid)}
      onClick={onClick}
    >
      <span className={styles.left}>
        {icon !== null && <span className={styles.lead}>{icon}</span>}
        {label !== null && (
          <>
            <span className={styles.label}>{label}</span>{' '}
          </>
        )}
        <span className={clsx(styles.value, mono ? styles.mono : styles.plain)}>{value}</span>
      </span>{' '}
      <span className={styles.right}>
        {context !== null && (
          <span className={clsx(styles.context, mono ? styles.contextSans : styles.contextMono)}>
            {context}
          </span>
        )}
        <Icon
          name={IconName.ChevronDown}
          size={SELECT_BUTTON_CHEVRON_SIZE}
          className={styles.chevron}
        />
      </span>
    </button>
  );

  return (
    <div className={clsx(styles.root, disabled && styles.disabled, className)}>
      {picker ? (
        <Popover
          open={isOpen}
          onOpenChange={changeOpen}
          trigger={trigger}
          bare
          ariaLabel={menuLabel ?? label ?? value}
        >
          <div ref={menuHostRef}>
            <Menu
              items={options}
              selectedId={selectedId}
              width={menuWidth}
              ariaLabel={menuLabel ?? label ?? value}
              onSelect={(id) => {
                onSelect?.(id);
                changeOpen(false);
              }}
            />
          </div>
        </Popover>
      ) : (
        trigger
      )}
      {hasError && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
