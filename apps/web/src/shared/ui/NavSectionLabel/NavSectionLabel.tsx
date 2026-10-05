import clsx from 'clsx';
import { IconButton, IconButtonSize } from '@/shared/ui/IconButton';
import { NAV_SECTION_LABEL_DEFAULT_ACTION_ICON } from '@/shared/ui/NavSectionLabel/NavSectionLabel.constants';
import type { NavSectionLabelProps } from '@/shared/ui/NavSectionLabel/NavSectionLabel.typedefs';
import styles from '@/shared/ui/NavSectionLabel/NavSectionLabel.module.scss';

export function NavSectionLabel({ label, id, action = null, className }: NavSectionLabelProps) {
  return (
    <div className={clsx(styles.root, action !== null && styles.withAction, className)}>
      <span id={id} className={styles.label}>
        {label}
      </span>
      {action !== null && (
        <IconButton
          icon={action.icon ?? NAV_SECTION_LABEL_DEFAULT_ACTION_ICON}
          label={action.label}
          size={IconButtonSize.Sm}
          onClick={action.onClick}
        />
      )}
    </div>
  );
}
