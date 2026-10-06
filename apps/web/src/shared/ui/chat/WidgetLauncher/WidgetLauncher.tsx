import clsx from 'clsx';
import { WIDGET_ACCENT_PROPERTY } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import type { WidgetAccentStyle } from '@/shared/ui/chat/ChatBubble/ChatBubble.typedefs';
import { WIDGET_LAUNCHER_ICON_SIZE } from '@/shared/ui/chat/WidgetLauncher/WidgetLauncher.constants';
import type { WidgetLauncherProps } from '@/shared/ui/chat/WidgetLauncher/WidgetLauncher.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/chat/WidgetLauncher/WidgetLauncher.module.scss';

export function WidgetLauncher({
  accent,
  open,
  onToggle,
  label,
  controls = null,
  className,
  style,
  ...rest
}: WidgetLauncherProps) {
  const accentStyle: WidgetAccentStyle = { ...style, [WIDGET_ACCENT_PROPERTY]: accent };

  return (
    <button
      {...rest}
      type="button"
      aria-label={label}
      aria-expanded={open}
      aria-controls={controls ?? undefined}
      style={accentStyle}
      className={clsx(styles.root, className)}
      onClick={onToggle}
    >
      <Icon name={open ? IconName.X : IconName.Msg} size={WIDGET_LAUNCHER_ICON_SIZE} />
    </button>
  );
}
