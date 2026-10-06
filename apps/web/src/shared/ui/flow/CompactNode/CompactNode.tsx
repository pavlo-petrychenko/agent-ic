import clsx from 'clsx';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { CompactNodeShape } from '@/shared/ui/flow/CompactNode/CompactNode.constants';
import type { CompactNodeProps } from '@/shared/ui/flow/CompactNode/CompactNode.typedefs';
import styles from '@/shared/ui/flow/CompactNode/CompactNode.module.scss';

export function CompactNode({
  label,
  kind,
  icon = null,
  shape = CompactNodeShape.Pill,
  selected = false,
  faded = false,
  disabled = false,
  inPort = null,
  outPorts = null,
  className,
  ...rest
}: CompactNodeProps) {
  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      aria-label={label}
      aria-current={selected ? 'true' : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      {...rest}
      className={clsx(
        styles.root,
        styles[shape],
        selected && styles.selected,
        faded && styles.faded,
        disabled && styles.disabled,
        className,
      )}
    >
      <NodeTile kind={kind} icon={icon} size={TileSize.Sm} />
      <span className={styles.label}>{label}</span>
      {inPort !== null && <span className={styles.inPort}>{inPort}</span>}
      {outPorts !== null && <span className={styles.outPorts}>{outPorts}</span>}
    </div>
  );
}
