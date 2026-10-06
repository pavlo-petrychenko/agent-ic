import clsx from 'clsx';
import { useId } from 'react';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/ui/actions/IconButton';
import {
  FLOW_EDGE_ARROW_PATH,
  FLOW_EDGE_ARROW_REF_X,
  FLOW_EDGE_ARROW_REF_Y,
  FLOW_EDGE_ARROW_SIZE,
  FLOW_EDGE_DELETE_SIZE,
} from '@/shared/ui/flow/FlowEdge/FlowEdge.constants';
import type { FlowEdgeProps } from '@/shared/ui/flow/FlowEdge/FlowEdge.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/flow/FlowEdge/FlowEdge.module.scss';

export function FlowEdge({
  path,
  midpoint = null,
  active = false,
  selected = false,
  drawing = false,
  inserting = false,
  onDelete = null,
  deleteLabel = null,
  edgeId = null,
  className,
}: FlowEdgeProps) {
  const markerId = useId();
  const showDelete = selected && !drawing && onDelete !== null && deleteLabel !== null;

  return (
    <g
      data-edge-id={edgeId ?? undefined}
      className={clsx(
        styles.root,
        active && styles.active,
        selected && styles.selected,
        drawing && styles.drawing,
        inserting && styles.inserting,
        className,
      )}
    >
      {!drawing && (
        <defs>
          <marker
            id={markerId}
            viewBox={`0 0 ${FLOW_EDGE_ARROW_SIZE} ${FLOW_EDGE_ARROW_SIZE}`}
            markerWidth={FLOW_EDGE_ARROW_SIZE}
            markerHeight={FLOW_EDGE_ARROW_SIZE}
            refX={FLOW_EDGE_ARROW_REF_X}
            refY={FLOW_EDGE_ARROW_REF_Y}
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d={FLOW_EDGE_ARROW_PATH} className={styles.arrow} />
          </marker>
        </defs>
      )}
      {!drawing && <path d={path} className={styles.hit} />}
      <path
        d={path}
        className={styles.line}
        markerEnd={drawing ? undefined : `url("#${markerId}")`}
      />
      {showDelete && midpoint !== null && (
        <foreignObject
          x={midpoint.x - FLOW_EDGE_DELETE_SIZE / 2}
          y={midpoint.y - FLOW_EDGE_DELETE_SIZE / 2}
          width={FLOW_EDGE_DELETE_SIZE}
          height={FLOW_EDGE_DELETE_SIZE}
          className={styles.deleteHost}
        >
          <IconButton
            icon={IconName.X}
            label={deleteLabel}
            size={IconButtonSize.Xs}
            variant={IconButtonVariant.Secondary}
            className={styles.delete}
            onClick={onDelete}
          />
        </foreignObject>
      )}
    </g>
  );
}
