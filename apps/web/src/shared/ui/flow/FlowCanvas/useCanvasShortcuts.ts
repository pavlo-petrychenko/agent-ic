import type { KeyboardEvent } from 'react';
import {
  FLOW_CANVAS_EDITABLE_SELECTOR,
  FLOW_CANVAS_NODE_ID_ATTRIBUTE,
  FLOW_CANVAS_NODE_SELECTOR,
  FlowCanvasKey,
} from '@/shared/ui/flow/FlowCanvas/FlowCanvas.constants';
import type { FlowCanvasSelection } from '@/shared/ui/flow/FlowCanvas/FlowCanvas.typedefs';

interface UseCanvasShortcutsOptions {
  selection: FlowCanvasSelection;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: (selection: FlowCanvasSelection) => void;
  onOpenNode: (id: string) => void;
  onEscape: () => void;
}

const hasSelection = (selection: FlowCanvasSelection): boolean =>
  selection.nodeIds.length > 0 || selection.edgeIds.length > 0;

const focusedNodeId = (target: EventTarget): string | null => {
  if (!(target instanceof Element)) {
    return null;
  }
  return (
    target.closest(FLOW_CANVAS_NODE_SELECTOR)?.getAttribute(FLOW_CANVAS_NODE_ID_ATTRIBUTE) ?? null
  );
};

const isEditable = (target: EventTarget): boolean =>
  target instanceof Element && target.closest(FLOW_CANVAS_EDITABLE_SELECTOR) !== null;

export function useCanvasShortcuts({
  selection,
  onDelete,
  onUndo,
  onRedo,
  onDuplicate,
  onOpenNode,
  onEscape,
}: UseCanvasShortcutsOptions) {
  const handleModifierKey = (event: KeyboardEvent<HTMLElement>): boolean => {
    const key = event.key.toLowerCase();
    if (key === FlowCanvasKey.Undo) {
      if (event.shiftKey) {
        onRedo();
      } else {
        onUndo();
      }
      return true;
    }
    if (key === FlowCanvasKey.Duplicate && hasSelection(selection)) {
      onDuplicate(selection);
      return true;
    }
    return false;
  };

  const handlePlainKey = (event: KeyboardEvent<HTMLElement>): boolean => {
    switch (event.key) {
      case FlowCanvasKey.Delete:
      case FlowCanvasKey.Backspace:
        if (!hasSelection(selection)) {
          return false;
        }
        onDelete();
        return true;
      case FlowCanvasKey.Enter: {
        const nodeId = focusedNodeId(event.target);
        if (nodeId === null) {
          return false;
        }
        onOpenNode(nodeId);
        return true;
      }
      case FlowCanvasKey.Escape:
        onEscape();
        return false;
      default:
        return false;
    }
  };

  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented || isEditable(event.target)) {
      return;
    }
    const modifier = event.metaKey || event.ctrlKey;
    const handled = modifier ? handleModifierKey(event) : handlePlainKey(event);
    if (handled) {
      event.preventDefault();
    }
  };
}
