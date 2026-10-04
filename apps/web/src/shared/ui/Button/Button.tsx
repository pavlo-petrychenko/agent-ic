import clsx from 'clsx';
import type { MouseEvent, ReactNode } from 'react';
import {
  BUTTON_ICON_SIZES,
  BUTTON_SPINNER_SIZE,
  BUTTON_SPINNER_STROKE_WIDTH,
  ButtonSize,
  ButtonVariant,
} from '@/shared/ui/Button/Button.constants';
import type {
  ButtonAnchorProps,
  ButtonOwnProps,
  ButtonProps,
} from '@/shared/ui/Button/Button.typedefs';
import { Icon, IconName } from '@/shared/ui/Icon';
import styles from '@/shared/ui/Button/Button.module.scss';

interface SplitableProps extends ButtonOwnProps {
  className?: string;
  children?: ReactNode;
}

function splitProps<T extends SplitableProps>(props: T) {
  const {
    variant = ButtonVariant.Primary,
    size = ButtonSize.Md,
    loading: loadingRequested = false,
    icon = null,
    fullWidth = false,
    disabled = false,
    className,
    children,
    ...rest
  } = props;
  const iconSize = BUTTON_ICON_SIZES[size];
  const loading = loadingRequested && variant !== ButtonVariant.Ghost;

  const classes = clsx(
    styles.root,
    styles[variant],
    variant !== ButtonVariant.Ghost && styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    disabled && styles.disabled,
    className,
  );

  const content = (
    <>
      {loading ? (
        <span className={styles.spinner}>
          <Icon
            name={IconName.Spinner}
            size={BUTTON_SPINNER_SIZE}
            strokeWidth={BUTTON_SPINNER_STROKE_WIDTH}
          />
        </span>
      ) : null}
      {!loading && icon !== null ? <Icon name={icon} size={iconSize} /> : null}
      <span>{children}</span>
    </>
  );

  return { classes, content, loading, inert: disabled || loading, rest };
}

function isAnchorProps(props: ButtonProps): props is ButtonAnchorProps {
  return typeof props.href === 'string';
}

export function Button(props: ButtonProps) {
  if (isAnchorProps(props)) {
    const { classes, content, loading, inert, rest } = splitProps(props);
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
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={inert || undefined}
        tabIndex={inert ? -1 : tabIndex}
        onClick={handleClick}
      >
        {content}
      </a>
    );
  }

  const { classes, content, loading, inert, rest } = splitProps(props);
  const { type = 'button', ...buttonRest } = rest;

  return (
    <button
      {...buttonRest}
      type={type}
      disabled={inert}
      aria-busy={loading || undefined}
      className={classes}
    >
      {content}
    </button>
  );
}
