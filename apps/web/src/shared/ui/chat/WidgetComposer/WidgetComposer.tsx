import clsx from 'clsx';
import { IconButton } from '@/shared/ui/actions/IconButton/IconButton';
import {
  IconButtonSize,
  IconButtonVariant,
} from '@/shared/ui/actions/IconButton/IconButton.constants';
import { WIDGET_ACCENT_PROPERTY } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import type { WidgetAccentStyle } from '@/shared/ui/chat/ChatBubble/ChatBubble.typedefs';
import { useAutoGrow } from '@/shared/ui/chat/Composer/useAutoGrow';
import { useSendOnEnter } from '@/shared/ui/chat/Composer/useSendOnEnter';
import type { WidgetComposerProps } from '@/shared/ui/chat/WidgetComposer/WidgetComposer.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/chat/WidgetComposer/WidgetComposer.module.scss';

export function WidgetComposer({
  value,
  onChange,
  onSend,
  attach,
  placeholder,
  messageLabel,
  sendLabel,
  accent,
  sending = false,
  disabled = false,
  className,
  style,
  ...rest
}: WidgetComposerProps) {
  const fieldRef = useAutoGrow(value);
  const empty = value.trim() === '';
  const canSend = !disabled && !sending && !empty;
  const handleKeyDown = useSendOnEnter(canSend, onSend);
  const accentStyle: WidgetAccentStyle = { ...style, [WIDGET_ACCENT_PROPERTY]: accent };

  return (
    <div {...rest} style={accentStyle} className={clsx(styles.root, className)}>
      {attach !== null && (
        <IconButton
          icon={IconName.Upload}
          label={attach.label}
          variant={IconButtonVariant.Ghost}
          size={IconButtonSize.Sm}
          disabled={disabled}
          onClick={attach.onAttach}
        />
      )}
      <textarea
        ref={fieldRef}
        rows={1}
        value={value}
        placeholder={placeholder}
        aria-label={messageLabel}
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
        size={IconButtonSize.Sm}
        loading={sending}
        disabled={disabled || (empty && !sending)}
        className={styles.send}
        onClick={onSend}
      />
    </div>
  );
}
