import clsx from 'clsx';
import { useId } from 'react';
import { IconButton } from '@/shared/ui/actions/IconButton/IconButton';
import {
  IconButtonSize,
  IconButtonVariant,
} from '@/shared/ui/actions/IconButton/IconButton.constants';
import { COMPOSER_NOTE_ICON_SIZE } from '@/shared/ui/chat/Composer/Composer.constants';
import type { ComposerProps } from '@/shared/ui/chat/Composer/Composer.typedefs';
import { useAutoGrow } from '@/shared/ui/chat/Composer/useAutoGrow';
import { useSendOnEnter } from '@/shared/ui/chat/Composer/useSendOnEnter';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { Textarea } from '@/shared/ui/inputs/Textarea/Textarea';
import styles from '@/shared/ui/chat/Composer/Composer.module.scss';

export function Composer({
  value,
  onChange,
  onSend,
  onRetry,
  placeholder,
  label,
  sendLabel,
  retryLabel,
  sending = false,
  error = null,
  disabled = false,
  disabledReason = null,
  className,
  ...rest
}: ComposerProps) {
  const fieldRef = useAutoGrow(value);
  const reasonId = useId();
  const empty = value.trim() === '';
  const canSend = !disabled && !sending && !empty;
  const showReason = disabled && disabledReason !== null;
  const showError = !disabled && error !== null;

  const handleKeyDown = useSendOnEnter(canSend, onSend);

  return (
    <div {...rest} className={clsx(styles.root, className)}>
      <div className={styles.row}>
        <Textarea
          ref={fieldRef}
          rows={1}
          value={value}
          placeholder={placeholder}
          aria-label={label}
          aria-describedby={showReason ? reasonId : undefined}
          readOnly={sending}
          disabled={disabled}
          className={styles.field}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        <IconButton
          icon={IconName.Send}
          label={sendLabel}
          variant={IconButtonVariant.Primary}
          size={IconButtonSize.Lg}
          loading={sending}
          disabled={disabled || (empty && !sending)}
          onClick={onSend}
        />
      </div>
      {showError && (
        <p role="alert" className={clsx(styles.note, styles.error)}>
          <Icon name={IconName.Alert} size={COMPOSER_NOTE_ICON_SIZE} />
          <span>{error}</span>
          {onRetry !== null && (
            <button type="button" className={styles.retry} onClick={onRetry}>
              {retryLabel}
            </button>
          )}
        </p>
      )}
      {showReason && (
        <p id={reasonId} className={styles.note}>
          {disabledReason}
        </p>
      )}
    </div>
  );
}
