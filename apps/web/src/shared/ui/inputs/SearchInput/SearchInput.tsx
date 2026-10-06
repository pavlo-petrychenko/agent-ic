import clsx from 'clsx';
import type { KeyboardEvent } from 'react';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { Input } from '@/shared/ui/inputs/Input/Input';
import {
  SEARCH_INPUT_ESCAPE_KEY,
  SEARCH_INPUT_ICON_SIZE,
  SEARCH_INPUT_TYPE,
} from '@/shared/ui/inputs/SearchInput/SearchInput.constants';
import type { SearchInputProps } from '@/shared/ui/inputs/SearchInput/SearchInput.typedefs';
import styles from '@/shared/ui/inputs/SearchInput/SearchInput.module.scss';

export function SearchInput({
  value,
  label,
  clearLabel,
  onClear,
  loading = false,
  disabled = false,
  className,
  onKeyDown,
  ...rest
}: SearchInputProps) {
  const filled = value !== '';

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.key === SEARCH_INPUT_ESCAPE_KEY && filled && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      onClear();
    }
  };

  return (
    <div className={clsx(styles.root, disabled && styles.disabled, className)}>
      <span className={styles.icon}>
        <Icon name={IconName.Search} size={SEARCH_INPUT_ICON_SIZE} />
      </span>
      <Input
        {...rest}
        type={SEARCH_INPUT_TYPE}
        value={value}
        disabled={disabled}
        aria-label={label}
        aria-busy={loading || undefined}
        className={styles.field}
        onKeyDown={handleKeyDown}
      />
      {loading && (
        <span className={styles.spinner}>
          <Icon name={IconName.Spinner} size={SEARCH_INPUT_ICON_SIZE} />
        </span>
      )}
      {!loading && filled && !disabled && (
        <IconButton
          icon={IconName.X}
          label={clearLabel}
          variant={IconButtonVariant.Ghost}
          size={IconButtonSize.Xs}
          className={styles.clear}
          onClick={onClear}
        />
      )}
    </div>
  );
}
