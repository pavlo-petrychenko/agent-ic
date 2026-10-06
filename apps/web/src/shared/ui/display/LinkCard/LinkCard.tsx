import clsx from 'clsx';
import type { LinkCardProps } from '@/shared/ui/display/LinkCard/LinkCard.typedefs';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { NodeKind, TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import styles from '@/shared/ui/display/LinkCard/LinkCard.module.scss';

export function LinkCard({
  href,
  title,
  icon = null,
  kind = NodeKind.Neutral,
  description = null,
  disabled = false,
  className,
  ...rest
}: LinkCardProps) {
  return (
    <a
      {...rest}
      href={disabled ? undefined : href}
      role={disabled ? 'link' : undefined}
      aria-disabled={disabled ? true : undefined}
      className={clsx(styles.root, disabled && styles.disabled, className)}
    >
      <NodeTile kind={kind} size={TileSize.Md} icon={icon} />
      <span className={styles.title}>{title}</span>
      {description !== null && <span className={styles.description}>{description}</span>}
    </a>
  );
}
