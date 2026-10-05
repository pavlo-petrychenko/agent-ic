import { createLink, type LinkComponent } from '@tanstack/react-router';
import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { NodeKind, TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { LINKED_ITEM_CHEVRON_SIZE } from '@/shared/ui/runs/LinkedItem/LinkedItem.constants';
import type { LinkedItemAnchorProps } from '@/shared/ui/runs/LinkedItem/LinkedItem.typedefs';
import styles from '@/shared/ui/runs/LinkedItem/LinkedItem.module.scss';

function LinkedItemAnchor({
  icon = IconName.ToolEvent,
  kind = NodeKind.Trig,
  disabled = false,
  className,
  href,
  onClick,
  tabIndex,
  children,
  ...rest
}: LinkedItemAnchorProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <a
      {...rest}
      href={href}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : tabIndex}
      onClick={handleClick}
      className={clsx(styles.root, disabled && styles.disabled, className)}
    >
      <NodeTile kind={kind} size={TileSize.Sm} icon={icon} />
      <span className={styles.text}>{children}</span>
      <span aria-hidden="true" className={styles.chevron}>
        <Icon name={IconName.ChevronRight} size={LINKED_ITEM_CHEVRON_SIZE} />
      </span>
    </a>
  );
}

const RouterLinkedItemAnchor = createLink(LinkedItemAnchor);

export const LinkedItem: LinkComponent<typeof LinkedItemAnchor> = (props) => (
  <RouterLinkedItemAnchor preload="intent" {...props} />
);
