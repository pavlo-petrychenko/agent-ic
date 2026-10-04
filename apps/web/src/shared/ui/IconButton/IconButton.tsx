import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { Icon, IconName } from '@/shared/ui/Icon';
import {
  ICON_BUTTON_ICON_SIZES,
  IconButtonSize,
  IconButtonVariant,
} from '@/shared/ui/IconButton/IconButton.constants';
import type {
  IconButtonAnchorProps,
  IconButtonOwnProps,
  IconButtonProps,
} from '@/shared/ui/IconButton/IconButton.typedefs';
import styles from '@/shared/ui/IconButton/IconButton.module.scss';

interface SplitableProps extends IconButtonOwnProps {
  className?: string;
}

function splitProps<T extends SplitableProps>(props: T) {
  const {
    icon,
    label,
    variant = IconButtonVariant.Ghost,
    size = IconButtonSize.Md,
    loading = false,
    disabled = false,
    className,
    ...rest
  } = props;

  const classes = clsx(
    styles.root,
    styles[variant],
    styles[size],
    loading && styles.loading,
    disabled && styles.disabled,
    className,
  );

  const glyph = (
    <Icon name={loading ? IconName.Spinner : icon} size={ICON_BUTTON_ICON_SIZES[size]} />
  );

  return { classes, glyph, label, loading, inert: disabled || loading, rest };
}

function isAnchorProps(props: IconButtonProps): props is IconButtonAnchorProps {
  return typeof props.href === 'string';
}

export function IconButton(props: IconButtonProps) {
  if (isAnchorProps(props)) {
    const { classes, glyph, label, loading, inert, rest } = splitProps(props);
    const { href, onClick, tabIndex, ...anchorRest } = rest;
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (inert) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };

    return (
      <a
        {...anchorRest}
        href={href}
        aria-label={label}
        aria-busy={loading || undefined}
        aria-disabled={inert || undefined}
        tabIndex={inert ? -1 : tabIndex}
        className={classes}
        onClick={handleClick}
      >
        {glyph}
      </a>
    );
  }

  const { classes, glyph, label, loading, inert, rest } = splitProps(props);
  const { type = 'button', ...buttonRest } = rest;

  return (
    <button
      {...buttonRest}
      type={type}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={inert}
      className={classes}
    >
      {glyph}
    </button>
  );
}
