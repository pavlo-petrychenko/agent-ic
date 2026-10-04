import { createLink, type LinkComponent } from '@tanstack/react-router';
import clsx from 'clsx';
import type { ComponentProps } from 'react';
import styles from '@/shared/ui/Link/Link.module.scss';

function AnchorBase({ className, children, ...rest }: ComponentProps<'a'>) {
  return (
    <a {...rest} className={clsx(styles.root, className)}>
      {children}
    </a>
  );
}

const RouterAnchor = createLink(AnchorBase);

export const Link: LinkComponent<typeof AnchorBase> = (props) => (
  <RouterAnchor preload="intent" {...props} />
);
