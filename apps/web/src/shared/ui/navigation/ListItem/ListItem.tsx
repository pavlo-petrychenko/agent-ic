import { createLink, type LinkComponent } from '@tanstack/react-router';
import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { NodeKind, TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { ListItemTitleStyle } from '@/shared/ui/navigation/ListItem/ListItem.constants';
import type { ListItemAnchorProps } from '@/shared/ui/navigation/ListItem/ListItem.typedefs';
import styles from '@/shared/ui/navigation/ListItem/ListItem.module.scss';

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
