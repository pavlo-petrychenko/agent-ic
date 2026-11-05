import { getViewportForBounds, useReactFlow, useStoreApi } from '@xyflow/react';
import type { Rect } from '@xyflow/react';
import { useCallback } from 'react';
import type { RefObject } from 'react';
import {
  FLOW_CANVAS_FIT_PADDING,
  FLOW_CANVAS_NODE_ID_ATTRIBUTE,
  FLOW_CANVAS_NODE_SELECTOR,
} from '@/shared/ui/flow/FlowCanvas/FlowCanvas.constants';
import type {
  CanvasEdge,
  CanvasNode,
  FlowCanvasFit,
} from '@/shared/ui/flow/FlowCanvas/FlowCanvas.typedefs';
import { FLOW_PORT_TERMINAL_ATTRIBUTE } from '@/shared/ui/flow/FlowPort/FlowPort.constants';

const union = (first: Rect, second: Rect): Rect => {
  const x = Math.min(first.x, second.x);
  const y = Math.min(first.y, second.y);
  return {
    x,
    y,
    width: Math.max(first.x + first.width, second.x + second.width) - x,
    height: Math.max(first.y + first.height, second.y + second.height) - y,
  };
};

const contains = (outer: Rect, inner: Rect): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

export function useFitContent(rootRef: RefObject<HTMLElement | null>) {
  const { getNodes, getNodesBounds, screenToFlowPosition, setViewport } = useReactFlow<
    CanvasNode,
    CanvasEdge
  >();
  const store = useStoreApi<CanvasNode, CanvasEdge>();

  return useCallback(
    ({ nodeIds, maxZoom, onlyWhenHidden }: FlowCanvasFit) => {
      const nodes = getNodes().filter((node) => nodeIds === null || nodeIds.includes(node.id));
      if (nodes.length === 0) {
        return;
      }
      const terminals = [
        ...(rootRef.current?.querySelectorAll(`[${FLOW_PORT_TERMINAL_ATTRIBUTE}]`) ?? []),
      ].filter((element) => {
        const owner = element
          .closest(FLOW_CANVAS_NODE_SELECTOR)
          ?.getAttribute(FLOW_CANVAS_NODE_ID_ATTRIBUTE);
        return owner !== undefined && owner !== null && nodes.some((node) => node.id === owner);
      });
      const bounds = terminals.reduce<Rect>((current, element) => {
        const box = element.getBoundingClientRect();
        const start = screenToFlowPosition({ x: box.left, y: box.top });
        const end = screenToFlowPosition({ x: box.right, y: box.bottom });
        return union(current, {
          x: start.x,
          y: start.y,
          width: end.x - start.x,
          height: end.y - start.y,
        });
      }, getNodesBounds(nodes));
      const { width, height, minZoom, transform } = store.getState();
      const [x, y, zoom] = transform;
      const visible = { x: -x / zoom, y: -y / zoom, width: width / zoom, height: height / zoom };
      if (onlyWhenHidden && contains(visible, bounds)) {
        return;
      }
      void setViewport(
        getViewportForBounds(bounds, width, height, minZoom, maxZoom, FLOW_CANVAS_FIT_PADDING),
      );
    },
    [getNodes, getNodesBounds, rootRef, screenToFlowPosition, setViewport, store],
  );
}
