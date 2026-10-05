import clsx from 'clsx';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import {
  TREE_FOLDER_CHEVRON_SIZE,
  TREE_FOLDER_CHEVRON_STROKE_WIDTH,
} from '@/shared/ui/data/TreeFolder/TreeFolder.constants';
import type { TreeFolderProps } from '@/shared/ui/data/TreeFolder/TreeFolder.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/data/TreeFolder/TreeFolder.module.scss';

export function TreeFolder({
  label,
  open,
  onOpenChange,
  disabled = false,
  className,
  children,
}: TreeFolderProps) {
  return (
    <CollapsiblePrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
      className={clsx(styles.root, className)}
    >
      <CollapsiblePrimitive.Trigger className={clsx(styles.trigger, disabled && styles.disabled)}>
        <Icon
          name={open ? IconName.ChevronDown : IconName.ChevronRight}
          size={TREE_FOLDER_CHEVRON_SIZE}
          strokeWidth={TREE_FOLDER_CHEVRON_STROKE_WIDTH}
          className={styles.chevron}
        />
        <span className={styles.label}>{label}</span>
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className={styles.children}>
        {children}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
