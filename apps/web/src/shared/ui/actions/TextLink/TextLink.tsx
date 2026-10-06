import { createLink, type LinkComponent } from '@tanstack/react-router';
import clsx from 'clsx';
import {
  EXTERNAL_LINK_REL,
  EXTERNAL_LINK_TARGET,
  TextLinkTone,
} from '@/shared/ui/actions/TextLink/TextLink.constants';
import type { TextLinkAnchorProps } from '@/shared/ui/actions/TextLink/TextLink.typedefs';
import styles from '@/shared/ui/actions/TextLink/TextLink.module.scss';

function AnchorBase({
  tone = TextLinkTone.Accent,
  inline = false,
  target,
  rel,
  className,
  children,
  ...rest
}: TextLinkAnchorProps) {
  const opensNewTab = target === EXTERNAL_LINK_TARGET;

  return (
    <a
      {...rest}
      target={target}
      rel={rel ?? (opensNewTab ? EXTERNAL_LINK_REL : undefined)}
      className={clsx(styles.root, styles[tone], inline && styles.inline, className)}
    >
      {children}
    </a>
  );
}

const RouterAnchor = createLink(AnchorBase);

export const TextLink: LinkComponent<typeof AnchorBase> = (props) => (
  <RouterAnchor preload="intent" {...props} />
);
