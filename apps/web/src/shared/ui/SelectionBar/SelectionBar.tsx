import clsx from 'clsx';
import type { KeyboardEvent } from 'react';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { IconButton, IconButtonSize } from '@/shared/ui/IconButton';
import {
  SELECTION_BAR_ESCAPE_KEY,
  SelectionBarVariant,
} from '@/shared/ui/SelectionBar/SelectionBar.constants';
import type { SelectionBarProps } from '@/shared/ui/SelectionBar/SelectionBar.typedefs';
import styles from '@/shared/ui/SelectionBar/SelectionBar.module.scss';

export function SelectionBar({
  countLabel,
  ariaLabel,
  variant = SelectionBarVariant.Inline,
  actions = null,
  onClear = null,
  clearLabel = null,
  className,
}: SelectionBarProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === SELECTION_BAR_ESCAPE_KEY && onClear !== null) {
      onClear();
    }
  };

  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-interactions
    <div
      role="toolbar"
      aria-label={ariaLabel}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={clsx(styles.root, styles[variant], className)}
    >
      <div className={styles.group}>
        <span aria-live="polite" className={styles.count}>
          {countLabel}
        </span>
        {actions}
      </div>
      {onClear !== null && clearLabel !== null && (
        <IconButton
          icon={IconName.X}
          label={clearLabel}
          size={IconButtonSize.Sm}
          onClick={onClear}
        />
      )}
    </div>
  );
}
