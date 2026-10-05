import clsx from 'clsx';
import { WIDGET_ACCENT_PROPERTY } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import type { WidgetAccentStyle } from '@/shared/ui/chat/ChatBubble/ChatBubble.typedefs';
import type { QuickRepliesProps } from '@/shared/ui/chat/QuickReplies/QuickReplies.typedefs';
import styles from '@/shared/ui/chat/QuickReplies/QuickReplies.module.scss';

export function QuickReplies({
  label,
  options,
  chosen,
  onChoose,
  disabled = false,
  accent = null,
  className,
  style,
  ...rest
}: QuickRepliesProps) {
  const settled = chosen !== null;
  const accentStyle: WidgetAccentStyle | null =
    accent === null ? null : { ...style, [WIDGET_ACCENT_PROPERTY]: accent };

  return (
    <fieldset
      {...rest}
      aria-label={label}
      disabled={disabled}
      style={accentStyle ?? style}
      className={clsx(styles.root, accent !== null && styles.accented, className)}
    >
      {options.map((option) => {
        const isChosen = option === chosen;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isChosen}
            disabled={disabled || (settled && !isChosen)}
            className={clsx(styles.pill, isChosen && styles.chosen, disabled && styles.dimmed)}
            onClick={() => {
              if (!settled) {
                onChoose(option);
              }
            }}
          >
            {option}
          </button>
        );
      })}
    </fieldset>
  );
}
