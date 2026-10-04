import clsx from 'clsx';
import { ToggleGroup } from 'radix-ui';
import type { KeyboardEvent } from 'react';
import { Icon } from '@/shared/ui/Icon/Icon';
import {
  THEME_TOGGLE_HORIZONTAL_ARROW_KEYS,
  THEME_TOGGLE_ITEM_ROLE_RESET,
  THEME_TOGGLE_MENU_ICON_SIZE,
  THEME_TOGGLE_MENU_ICON_STROKE_WIDTH,
  THEME_TOGGLE_OPTIONS,
  ThemeToggleVariant,
} from '@/shared/ui/ThemeToggle/ThemeToggle.constants';
import type {
  ThemeToggleOption,
  ThemeToggleProps,
} from '@/shared/ui/ThemeToggle/ThemeToggle.typedefs';
import { Tooltip } from '@/shared/ui/Tooltip';
import styles from '@/shared/ui/ThemeToggle/ThemeToggle.module.scss';

export function ThemeToggle({
  value,
  onChange,
  variant,
  labels,
  ariaLabel,
  disabled = false,
  className,
}: ThemeToggleProps) {
  const handleValueChange = (next: string) => {
    const option = THEME_TOGGLE_OPTIONS.find((candidate) => candidate.value === next);
    if (option !== undefined && option.value !== value) {
      onChange(option.value);
    }
  };

  const keepArrowsInside = (event: KeyboardEvent<HTMLDivElement>) => {
    if (THEME_TOGGLE_HORIZONTAL_ARROW_KEYS.includes(event.key)) {
      event.stopPropagation();
    }
  };

  const iconOnly = variant === ThemeToggleVariant.Menu;

  const renderItem = (option: ThemeToggleOption) => (
    <ToggleGroup.Item
      key={option.value}
      value={option.value}
      {...THEME_TOGGLE_ITEM_ROLE_RESET}
      aria-pressed={option.value === value}
      aria-label={iconOnly ? labels[option.value] : undefined}
      className={styles.option}
    >
      {iconOnly ? (
        <Icon
          name={option.icon}
          size={THEME_TOGGLE_MENU_ICON_SIZE}
          strokeWidth={THEME_TOGGLE_MENU_ICON_STROKE_WIDTH}
        />
      ) : (
        labels[option.value]
      )}
    </ToggleGroup.Item>
  );

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={handleValueChange}
      onKeyDown={keepArrowsInside}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      aria-label={ariaLabel}
      disabled={disabled}
      className={clsx(styles.root, styles[variant], disabled && styles.disabled, className)}
    >
      {THEME_TOGGLE_OPTIONS.map((option) =>
        iconOnly ? (
          <Tooltip key={option.value} content={labels[option.value]}>
            {renderItem(option)}
          </Tooltip>
        ) : (
          renderItem(option)
        ),
      )}
    </ToggleGroup.Root>
  );
}
