import clsx from 'clsx';
import { useId } from 'react';
import {
  FLOW_THUMBNAIL_ARROW_PATH,
  FLOW_THUMBNAIL_ARROW_SIZE,
  FLOW_THUMBNAIL_METRICS,
  FlowThumbnailSize,
} from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.constants';
import type { FlowThumbnailProps } from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.typedefs';
import { useFlowThumbnailLayout } from '@/shared/ui/flow/FlowThumbnail/useFlowThumbnailLayout';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import styles from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.module.scss';

export function FlowThumbnail({
  nodes,
  edges,
  ariaLabel,
  size = FlowThumbnailSize.Md,
  height = null,
  className,
  style,
  ...rest
}: FlowThumbnailProps) {
  const markerId = useId();
  const metrics = FLOW_THUMBNAIL_METRICS[size];
  const layout = useFlowThumbnailLayout(nodes, edges, size);
  const iconOffset = (metrics.badgeSize - metrics.iconSize) / 2;

  return (
    <svg
      {...rest}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      style={height === null ? style : { ...style, height }}
      className={clsx(styles.root, height !== null && styles.fixedHeight, className)}
    >
      <defs>
        <marker
          id={markerId}
          viewBox={`0 0 ${FLOW_THUMBNAIL_ARROW_SIZE} ${FLOW_THUMBNAIL_ARROW_SIZE}`}
          markerWidth={FLOW_THUMBNAIL_ARROW_SIZE}
          markerHeight={FLOW_THUMBNAIL_ARROW_SIZE}
          refX={FLOW_THUMBNAIL_ARROW_SIZE}
          refY={FLOW_THUMBNAIL_ARROW_SIZE / 2}
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d={FLOW_THUMBNAIL_ARROW_PATH} className={styles.arrow} />
        </marker>
      </defs>
      {layout.edges.map((edge) => (
        <path
          key={edge.id}
          d={edge.path}
          data-edge-id={edge.id}
          markerEnd={`url("#${markerId}")`}
          className={clsx(styles.edge, edge.dimmed && styles.dimmed)}
        />
      ))}
      {layout.nodes.map((node) => (
        <g
          key={node.id}
          data-node-id={node.id}
          data-highlighted={node.highlighted || undefined}
          className={clsx(
            styles.node,
            styles[node.kind],
            layout.dimming && !node.highlighted && styles.dimmed,
          )}
        >
          <title>{node.title}</title>
          {node.highlighted && (
            <rect
              x={node.x - metrics.ringGap}
              y={node.y - metrics.ringGap}
              width={metrics.nodeWidth + metrics.ringGap * 2}
              height={metrics.nodeHeight + metrics.ringGap * 2}
              rx={metrics.nodeRadius + metrics.ringGap}
              className={styles.ring}
            />
          )}
          <rect
            x={node.x}
            y={node.y}
            width={metrics.nodeWidth}
            height={metrics.nodeHeight}
            rx={metrics.nodeRadius}
            className={styles.card}
          />
          <rect
            x={node.x + metrics.badgeInset}
            y={node.y + metrics.badgeInset}
            width={metrics.badgeSize}
            height={metrics.badgeSize}
            rx={metrics.badgeRadius}
            className={styles.badge}
          />
          <Icon
            name={node.icon}
            size={metrics.iconSize}
            strokeWidth={metrics.iconStrokeWidth}
            x={node.x + metrics.badgeInset + iconOffset}
            y={node.y + metrics.badgeInset + iconOffset}
            className={styles.icon}
          />
          {node.text !== '' && (
            <text
              x={node.x + metrics.badgeInset + metrics.badgeSize + metrics.labelGap}
              y={node.y + metrics.nodeHeight / 2}
              fontSize={metrics.fontSize}
              className={styles.label}
            >
              {node.text}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
