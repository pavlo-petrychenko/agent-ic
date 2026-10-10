import clsx from 'clsx';
import {
  TRIGGER_NODE_ICON_SIZE,
  TRIGGER_NODE_INVALID_ICON_SIZE,
} from '@/shared/ui/flow/TriggerNode/TriggerNode.constants';
import type { TriggerNodeProps } from '@/shared/ui/flow/TriggerNode/TriggerNode.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/flow/TriggerNode/TriggerNode.module.scss';

export function TriggerNode({
  title,
  subtitle = null,
  icon = IconName.Msg,
  selected = false,
  faded = false,
  disabled = false,
  invalidLabel = null,
  outPort = null,
  className,
  ...rest
}: TriggerNodeProps) {
  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      aria-label={title}
      aria-current={selected ? 'true' : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      {...rest}
      className={clsx(
        styles.root,
        selected && styles.selected,
        faded && styles.faded,
        disabled && styles.disabled,
        invalidLabel !== null && styles.invalid,
        className,
      )}
    >
      <span className={styles.title}>
        <Icon name={icon} size={TRIGGER_NODE_ICON_SIZE} />
        <span className={styles.titleText}>{title}</span>
        {invalidLabel !== null && (
          <Icon
            name={IconName.Alert}
            title={invalidLabel}
            size={TRIGGER_NODE_INVALID_ICON_SIZE}
            className={styles.invalidIcon}
          />
        )}
      </span>
      {subtitle !== null && <span className={styles.subtitle}>{subtitle}</span>}
      {outPort !== null && <span className={styles.outPort}>{outPort}</span>}
    </div>
  );
}
