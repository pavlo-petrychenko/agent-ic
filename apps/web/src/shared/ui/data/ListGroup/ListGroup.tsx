import clsx from 'clsx';
import { useId } from 'react';
import { IconButton } from '@/shared/ui/actions/IconButton/IconButton';
import { IconButtonSize } from '@/shared/ui/actions/IconButton/IconButton.constants';
import {
  LIST_GROUP_CHEVRON_SIZE,
  LIST_GROUP_CHEVRON_STROKE_WIDTH,
  LIST_GROUP_COUNT_SEPARATOR,
} from '@/shared/ui/data/ListGroup/ListGroup.constants';
import type { ListGroupProps } from '@/shared/ui/data/ListGroup/ListGroup.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/data/ListGroup/ListGroup.module.scss';

export function ListGroup({
  title,
  children,
  count = null,
  addLabel = null,
  onAdd = null,
  addDisabled = false,
  collapsed = false,
  onCollapsedChange = null,
  className,
}: ListGroupProps) {
  const titleId = useId();
  const itemsId = useId();
  const heading =
    collapsed && count !== null ? `${title}${LIST_GROUP_COUNT_SEPARATOR}${count}` : title;

  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
    <div role="group" aria-labelledby={titleId} className={clsx(styles.root, className)}>
      <div className={styles.header}>
        {onCollapsedChange === null ? (
          <span id={titleId} className={styles.title}>
            {heading}
          </span>
        ) : (
          <button
            type="button"
            id={titleId}
            aria-expanded={!collapsed}
            aria-controls={itemsId}
            className={styles.toggle}
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {collapsed && (
              <Icon
                name={IconName.ChevronRight}
                size={LIST_GROUP_CHEVRON_SIZE}
                strokeWidth={LIST_GROUP_CHEVRON_STROKE_WIDTH}
                className={styles.chevron}
              />
            )}
            <span className={styles.title}>{heading}</span>
          </button>
        )}
        {onAdd !== null && addLabel !== null && (
          <IconButton
            icon={IconName.Plus}
            label={addLabel}
            size={IconButtonSize.Sm}
            disabled={addDisabled}
            onClick={onAdd}
          />
        )}
      </div>
      <div id={itemsId} hidden={collapsed} className={styles.items}>
        {children}
      </div>
    </div>
  );
}
