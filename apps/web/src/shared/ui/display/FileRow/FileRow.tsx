import clsx from 'clsx';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { FILE_ROW_LABEL_SEPARATOR } from '@/shared/ui/display/FileRow/FileRow.constants';
import type { FileRowProps } from '@/shared/ui/display/FileRow/FileRow.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/shared/ui/display/FileRow/FileRow.module.scss';

export function FileRow({
  icon,
  name,
  subtitle,
  status = null,
  removeLabel,
  onRemove,
  disabled = false,
  className,
  ...rest
}: FileRowProps) {
  return (
    <li {...rest} className={clsx(styles.root, disabled && styles.disabled, className)}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </span>
      <span className={styles.trailing}>
        {status}
        <IconButton
          icon={IconName.X}
          size={IconButtonSize.Sm}
          label={`${removeLabel}${FILE_ROW_LABEL_SEPARATOR}${name}`}
          disabled={disabled}
          onClick={onRemove}
        />
      </span>
    </li>
  );
}
