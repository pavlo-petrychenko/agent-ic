import { useReactFlow } from '@xyflow/react';
import { useState } from 'react';
import type { DragEvent } from 'react';
import {
  FLOW_CANVAS_DROP_EFFECT,
  FLOW_CANVAS_EDGE_ID_ATTRIBUTE,
  FLOW_CANVAS_EDGE_SELECTOR,
} from '@/shared/ui/flow/FlowCanvas/FlowCanvas.constants';
import type { FlowCanvasPaletteDrop } from '@/shared/ui/flow/FlowCanvas/FlowCanvas.typedefs';
import { PALETTE_ITEM_DRAG_TYPE } from '@/shared/ui/flow/PaletteItem/PaletteItem.constants';

const carriesStep = (event: DragEvent<HTMLElement>): boolean =>
  event.dataTransfer.types.includes(PALETTE_ITEM_DRAG_TYPE);

const edgeAtPoint = (x: number, y: number): string | null => {
  if (typeof document.elementsFromPoint !== 'function') {
    return null;
  }
  for (const element of document.elementsFromPoint(x, y)) {
    const edge = element.closest(FLOW_CANVAS_EDGE_SELECTOR);
    if (edge !== null) {
      return edge.getAttribute(FLOW_CANVAS_EDGE_ID_ATTRIBUTE);
    }
  }
  return null;
};

export function usePaletteDrop(onPaletteDrop: (drop: FlowCanvasPaletteDrop) => void) {
  const { screenToFlowPosition } = useReactFlow();
  const [insertEdgeId, setInsertEdgeId] = useState<string | null>(null);

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    if (!carriesStep(event)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = FLOW_CANVAS_DROP_EFFECT;
    setInsertEdgeId(edgeAtPoint(event.clientX, event.clientY));
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    const related = event.relatedTarget;
    if (related instanceof Node && event.currentTarget.contains(related)) {
      return;
    }
    setInsertEdgeId(null);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    if (!carriesStep(event)) {
      return;
    }
    event.preventDefault();
    onPaletteDrop({
      data: event.dataTransfer.getData(PALETTE_ITEM_DRAG_TYPE),
      position: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      edgeId: edgeAtPoint(event.clientX, event.clientY),
    });
    setInsertEdgeId(null);
  };

  return { insertEdgeId, dropHandlers: { onDragOver, onDragLeave, onDrop } };
}
