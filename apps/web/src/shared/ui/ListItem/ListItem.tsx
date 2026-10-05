import { createLink, type LinkComponent } from '@tanstack/react-router';
import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { ListItemTitleStyle } from '@/shared/ui/ListItem/ListItem.constants';
import type { ListItemAnchorProps } from '@/shared/ui/ListItem/ListItem.typedefs';
import { NodeTile } from '@/shared/ui/NodeTile/NodeTile';
import { NodeKind, TileSize } from '@/shared/ui/NodeTile/NodeTile.constants';
import styles from '@/shared/ui/ListItem/ListItem.module.scss';

function ListAnchor({
  title,
  subtitle = null,
  icon = null,
  tone = NodeKind.Neutral,
  selected = false,
  titleStyle = ListItemTitleStyle.Sans,
  trailing = null,
  disabled = false,
  className,
  href,
  onClick,
  tabIndex,
  ...rest
}: ListItemAnchorProps) {
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
      aria-current={selected ? 'page' : rest['aria-current']}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : tabIndex}
      onClick={handleClick}
      className={clsx(styles.root, disabled && styles.disabled, className)}
    >
      <NodeTile kind={tone} size={TileSize.Md} icon={icon} />
      <span className={styles.text}>
        <span className={clsx(styles.title, titleStyle === ListItemTitleStyle.Mono && styles.mono)}>
          {title}
        </span>
        {subtitle !== null && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
      {trailing !== null && <span className={styles.trailing}>{trailing}</span>}
    </a>
  );
}

const RouterListAnchor = createLink(ListAnchor);

export const ListItem: LinkComponent<typeof ListAnchor> = (props) => (
  <RouterListAnchor preload="intent" {...props} />
);
