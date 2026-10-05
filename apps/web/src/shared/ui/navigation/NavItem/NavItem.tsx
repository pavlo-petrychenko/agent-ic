import { createLink, type LinkComponent } from '@tanstack/react-router';
import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import {
  NAV_ITEM_ICON_SIZE,
  NAV_ITEM_RAIL_ICON_SIZE,
  NavItemLayout,
} from '@/shared/ui/navigation/NavItem/NavItem.constants';
import type { NavItemAnchorProps } from '@/shared/ui/navigation/NavItem/NavItem.typedefs';
import { Tooltip, TooltipSide } from '@/shared/ui/overlays/Tooltip';
import styles from '@/shared/ui/navigation/NavItem/NavItem.module.scss';

function NavAnchor({
  icon = null,
  meta = null,
  layout = NavItemLayout.Sidebar,
  tooltip = null,
  disabled = false,
  className,
  children,
  href,
  onClick,
  tabIndex,
  ...rest
}: NavItemAnchorProps) {
  const rail = layout === NavItemLayout.Rail;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const anchor = (
    <a
      {...rest}
      href={href}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : tabIndex}
      onClick={handleClick}
      className={clsx(styles.root, rail && styles.rail, disabled && styles.disabled, className)}
    >
      {icon !== null && (
        <span className={styles.icon}>
          <Icon name={icon} size={rail ? NAV_ITEM_RAIL_ICON_SIZE : NAV_ITEM_ICON_SIZE} />
        </span>
      )}
      <span className={clsx(styles.label, rail && styles.visuallyHidden)}>{children}</span>
      {meta !== null && <span className={styles.meta}>{meta}</span>}
    </a>
  );

  if (!rail) {
    return anchor;
  }

  return (
    <Tooltip content={tooltip ?? children} side={TooltipSide.Right} arrow={false}>
      {anchor}
    </Tooltip>
  );
}

const RouterNavAnchor = createLink(NavAnchor);

export const NavItem: LinkComponent<typeof NavAnchor> = (props) => (
  <RouterNavAnchor preload="intent" {...props} />
);
