import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react';
import type {
  Connection,
  EdgeChange,
  NodeMouseHandler,
  EdgeTypes,
  OnConnectEnd,
  IsValidConnection,
  NodeChange,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Button } from '@/shared/ui/actions/Button/Button';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { SelectionBar, SelectionBarVariant } from '@/shared/ui/data/SelectionBar';
import { EmptyState } from '@/shared/ui/display/EmptyState/EmptyState';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { CanvasConnectionLine } from '@/shared/ui/flow/FlowCanvas/CanvasConnectionLine';
import { CanvasEdge as CanvasEdgeView } from '@/shared/ui/flow/FlowCanvas/CanvasEdge';
import { CanvasNode as CanvasNodeView } from '@/shared/ui/flow/FlowCanvas/CanvasNode';
import {
  FLOW_CANVAS_EDGE_TYPE,
  FLOW_CANVAS_FIT_PADDING,
  FLOW_CANVAS_GRID_COLOR,
  FLOW_CANVAS_GRID_DOT_SIZE,
  FLOW_CANVAS_GRID_GAP,
  FLOW_CANVAS_IN_PORT_ID,
  FLOW_CANVAS_MENU_FOCUS_SELECTOR,
  FLOW_CANVAS_MIDDLE_MOUSE_BUTTON,
  FLOW_CANVAS_MIN_SELECTION_FOR_BAR,
  FLOW_CANVAS_MULTI_SELECT_KEYS,
  FLOW_CANVAS_NODE_TYPE,
  FLOW_CANVAS_PAN_KEY,
  FLOW_CANVAS_ZOOM_KEYS,
  FlowCanvasContextAction,
} from '@/shared/ui/flow/FlowCanvas/FlowCanvas.constants';
import type {
  AddStepMenuState,
  CanvasEdge,
  ContextMenuState,
  CanvasNode,
  FlowCanvasNodeMove,
  FlowCanvasProps,
  FlowCanvasSelection,
} from '@/shared/ui/flow/FlowCanvas/FlowCanvas.typedefs';
import { useCanvasShortcuts } from '@/shared/ui/flow/FlowCanvas/useCanvasShortcuts';
import { useKeyboardConnection } from '@/shared/ui/flow/FlowCanvas/useKeyboardConnection';
import { usePaletteDrop } from '@/shared/ui/flow/FlowCanvas/usePaletteDrop';
import { ZoomControl } from '@/shared/ui/flow/ZoomControl/ZoomControl';
import { ZOOM_MAX, ZOOM_MIN } from '@/shared/ui/flow/ZoomControl/ZoomControl.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { Menu, MenuVariant } from '@/shared/ui/overlays/Menu';
import { useToast } from '@/shared/ui/overlays/Toast';
import styles from '@/shared/ui/flow/FlowCanvas/FlowCanvas.module.scss';

const NODE_TYPES: NodeTypes = { [FLOW_CANVAS_NODE_TYPE]: CanvasNodeView };
const EDGE_TYPES: EdgeTypes = { [FLOW_CANVAS_EDGE_TYPE]: CanvasEdgeView };
const PAN_BUTTONS = [FLOW_CANVAS_MIDDLE_MOUSE_BUTTON];
const PRO_OPTIONS = { hideAttribution: true };
const NO_PORTS: ReadonlySet<string> = new Set();

const applySelection = (
  current: readonly string[],
  changes: readonly { id: string; selected: boolean }[],
): string[] => {
  const next = new Set(current);
  for (const change of changes) {
    if (change.selected) {
      next.add(change.id);
    } else {
      next.delete(change.id);
    }
  }
  return [...next];
};

const pointerOf = (event: MouseEvent | TouchEvent): { x: number; y: number } | null => {
  if ('changedTouches' in event) {
    const touch = event.changedTouches.item(0);
    return touch === null ? null : { x: touch.clientX, y: touch.clientY };
  }
  return { x: event.clientX, y: event.clientY };
};

function FlowCanvasSurface({
  nodes,
  edges,
  selection,
  viewport,
  labels,
  addStepItems,
  canConnect,
  onViewportChange,
  onNodesMove,
  onSelectionChange,
  onConnect,
  onDelete,
  onUndo,
  onRedo,
  onDuplicate,
  onOpenNode,
  onPaletteDrop,
  onAddStep,
  onAddTrigger,
  className,
}: FlowCanvasProps) {
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow();
  const { showToast } = useToast();
  const rootRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef(selection);
  const [measured, setMeasured] = useState<ReadonlyMap<string, { width: number; height: number }>>(
    new Map(),
  );
  const [addStep, setAddStep] = useState<AddStepMenuState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const keyboard = useKeyboardConnection({ nodes, canConnect, onConnect });
  const { insertEdgeId, dropHandlers } = usePaletteDrop(onPaletteDrop);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    if (addStep !== null || contextMenu !== null) {
      menuRef.current?.querySelector<HTMLElement>(FLOW_CANVAS_MENU_FOCUS_SELECTOR)?.focus();
    }
  }, [addStep, contextMenu]);

  const emitSelection = (next: FlowCanvasSelection) => {
    selectionRef.current = next;
    onSelectionChange(next);
  };

  const deleteSelection = (target: FlowCanvasSelection) => {
    rootRef.current?.focus();
    onDelete(target);
    showToast({ message: labels.deleted, action: { label: labels.undo, onClick: onUndo } });
  };

  const connectedPorts = useMemo(() => {
    const ports = new Map<string, Set<string>>();
    const add = (nodeId: string, portId: string) => {
      const set = ports.get(nodeId) ?? new Set<string>();
      set.add(portId);
      ports.set(nodeId, set);
    };
    for (const edge of edges) {
      add(edge.source, edge.sourcePort);
      add(edge.target, FLOW_CANVAS_IN_PORT_ID);
    }
    return ports;
  }, [edges]);

  const rfNodes: CanvasNode[] = nodes.map((node) => {
    const size = measured.get(node.id);
    return {
      id: node.id,
      type: FLOW_CANVAS_NODE_TYPE,
      position: node.position,
      selected: selection.nodeIds.includes(node.id),
      ...(size === undefined ? {} : { measured: size }),
      data: {
        node,
        connectedPorts: connectedPorts.get(node.id) ?? NO_PORTS,
        keyboardConnection: keyboard.connection,
        canConnect,
        portKeyboard: keyboard.keyboardFor(node.id),
      },
    };
  });

  const rfEdges: CanvasEdge[] = edges.map((edge) => ({
    id: edge.id,
    type: FLOW_CANVAS_EDGE_TYPE,
    source: edge.source,
    sourceHandle: edge.sourcePort,
    target: edge.target,
    targetHandle: FLOW_CANVAS_IN_PORT_ID,
    selected: selection.edgeIds.includes(edge.id),
    data: {
      active: edge.active ?? false,
      inserting: edge.id === insertEdgeId,
      deleteLabel: labels.deleteConnection,
      onDelete: () => deleteSelection({ nodeIds: [], edgeIds: [edge.id] }),
    },
  }));

  const handleNodesChange = (changes: NodeChange<CanvasNode>[]) => {
    const moves: FlowCanvasNodeMove[] = [];
    const selects: { id: string; selected: boolean }[] = [];
    const sizes = new Map(measured);
    let resized = false;
    for (const change of changes) {
      if (change.type === 'dimensions' && change.dimensions !== undefined) {
        sizes.set(change.id, change.dimensions);
        resized = true;
      }
      if (change.type === 'position' && change.position !== undefined) {
        moves.push({
          id: change.id,
          position: change.position,
          dragging: change.dragging ?? false,
        });
      }
      if (change.type === 'select') {
        selects.push(change);
      }
    }
    if (resized) {
      setMeasured(sizes);
    }
    if (moves.length > 0) {
      onNodesMove(moves);
    }
    if (selects.length > 0) {
      const current = selectionRef.current;
      emitSelection({ ...current, nodeIds: applySelection(current.nodeIds, selects) });
    }
  };

  const handleEdgesChange = (changes: EdgeChange<CanvasEdge>[]) => {
    const selects = changes.flatMap((change) => (change.type === 'select' ? [change] : []));
    if (selects.length > 0) {
      const current = selectionRef.current;
      emitSelection({ ...current, edgeIds: applySelection(current.edgeIds, selects) });
    }
  };

  const handleConnect = (connection: Connection) => {
    if (connection.sourceHandle !== null && connection.sourceHandle !== undefined) {
      onConnect({
        source: connection.source,
        sourcePort: connection.sourceHandle,
        target: connection.target,
      });
    }
  };

  const isValidConnection: IsValidConnection<CanvasEdge> = (connection) =>
    connection.source !== connection.target && canConnect(connection.source, connection.target);

  const handleConnectEnd: OnConnectEnd = (event, state) => {
    const rect = rootRef.current?.getBoundingClientRect() ?? null;
    const pointer = pointerOf(event);
    if (state.isValid === true || state.fromNode === null || state.toNode !== null) {
      return;
    }
    const sourcePort = state.fromHandle?.id ?? null;
    if (rect === null || pointer === null || sourcePort === null) {
      return;
    }
    setContextMenu(null);
    setAddStep({
      left: pointer.x - rect.left,
      top: pointer.y - rect.top,
      position: screenToFlowPosition(pointer),
      source: state.fromNode.id,
      sourcePort,
    });
  };

  const handleAddStep = (itemId: string) => {
    if (addStep !== null) {
      onAddStep({
        itemId,
        position: addStep.position,
        source: addStep.source,
        sourcePort: addStep.sourcePort,
      });
    }
    setAddStep(null);
  };

  const openContextMenu = (event: ReactMouseEvent, target: FlowCanvasSelection) => {
    event.preventDefault();
    const rect = rootRef.current?.getBoundingClientRect() ?? null;
    if (rect === null || target.nodeIds.length === 0) {
      return;
    }
    setAddStep(null);
    setContextMenu({ left: event.clientX - rect.left, top: event.clientY - rect.top, target });
  };

  const handleNodeContextMenu: NodeMouseHandler<CanvasNode> = (event, node) => {
    const current = selectionRef.current;
    if (current.nodeIds.includes(node.id)) {
      openContextMenu(event, current);
      return;
    }
    const target = { nodeIds: [node.id], edgeIds: [] };
    emitSelection(target);
    openContextMenu(event, target);
  };

  const handleContextAction = (action: string) => {
    if (contextMenu !== null && action === FlowCanvasContextAction.Duplicate) {
      onDuplicate(contextMenu.target);
    }
    if (contextMenu !== null && action === FlowCanvasContextAction.Delete) {
      deleteSelection(contextMenu.target);
    }
    setContextMenu(null);
  };

  const handleKeyDown = useCanvasShortcuts({
    selection,
    onDelete: () => deleteSelection(selection),
    onUndo,
    onRedo,
    onDuplicate,
    onOpenNode,
    onEscape: () => {
      setAddStep(null);
      setContextMenu(null);
      keyboard.cancel();
    },
  });

  const selectedCount = selection.nodeIds.length;

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      ref={rootRef}
      aria-label={labels.canvas}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className={clsx(styles.root, className)}
      onKeyDown={handleKeyDown}
      {...dropHandlers}
    >
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        viewport={viewport}
        onViewportChange={onViewportChange}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onConnectEnd={handleConnectEnd}
        onPaneClick={() => {
          setAddStep(null);
          setContextMenu(null);
        }}
        onNodeContextMenu={handleNodeContextMenu}
        onSelectionContextMenu={(event) => openContextMenu(event, selectionRef.current)}
        isValidConnection={isValidConnection}
        connectionLineComponent={CanvasConnectionLine}
        minZoom={ZOOM_MIN}
        maxZoom={ZOOM_MAX}
        panOnDrag={PAN_BUTTONS}
        panOnScroll
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        selectionKeyCode={null}
        panActivationKeyCode={FLOW_CANVAS_PAN_KEY}
        zoomActivationKeyCode={[...FLOW_CANVAS_ZOOM_KEYS]}
        multiSelectionKeyCode={[...FLOW_CANVAS_MULTI_SELECT_KEYS]}
        deleteKeyCode={null}
        nodesFocusable={false}
        edgesFocusable={false}
        disableKeyboardA11y
        proOptions={PRO_OPTIONS}
        ariaLabelConfig={{
          'node.a11yDescription.default': labels.keyboardHelp,
          'node.a11yDescription.keyboardDisabled': labels.keyboardHelp,
          'edge.a11yDescription.default': labels.keyboardHelp,
          'handle.ariaLabel': labels.port,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={FLOW_CANVAS_GRID_GAP}
          size={FLOW_CANVAS_GRID_DOT_SIZE}
          color={FLOW_CANVAS_GRID_COLOR}
        />
      </ReactFlow>
      {nodes.length === 0 && (
        <div className={styles.empty}>
          <EmptyState
            icon={IconName.Bolt}
            title={labels.emptyTitle}
            description={labels.emptyDescription}
            actions={<Button onClick={onAddTrigger}>{labels.emptyAction}</Button>}
          />
        </div>
      )}
      {selectedCount >= FLOW_CANVAS_MIN_SELECTION_FOR_BAR && (
        <SelectionBar
          variant={SelectionBarVariant.Floating}
          ariaLabel={labels.selectionToolbar}
          countLabel={labels.selectionCount(selectedCount)}
          clearLabel={labels.clearSelection}
          onClear={() => emitSelection({ nodeIds: [], edgeIds: [] })}
          className={styles.selectionBar}
          actions={
            <>
              <IconButton
                icon={IconName.Copy}
                label={labels.duplicate}
                size={IconButtonSize.Sm}
                onClick={() => onDuplicate(selection)}
              />
              <IconButton
                icon={IconName.X}
                label={labels.delete}
                size={IconButtonSize.Sm}
                onClick={() => deleteSelection(selection)}
              />
            </>
          }
        />
      )}
      {addStep !== null && (
        <div
          ref={menuRef}
          className={styles.floatingMenu}
          style={{ left: addStep.left, top: addStep.top }}
        >
          <Menu
            ariaLabel={labels.addStep}
            variant={MenuVariant.Action}
            onSelect={handleAddStep}
            items={addStepItems.map((item) => ({
              id: item.id,
              label: item.label,
              leading: <NodeTile kind={item.kind} icon={item.icon ?? null} size={TileSize.Sm} />,
            }))}
          />
        </div>
      )}
      {contextMenu !== null && (
        <div
          ref={menuRef}
          className={styles.floatingMenu}
          style={{ left: contextMenu.left, top: contextMenu.top }}
        >
          <Menu
            ariaLabel={labels.stepActions}
            variant={MenuVariant.Action}
            onSelect={handleContextAction}
            items={[
              { id: FlowCanvasContextAction.Duplicate, label: labels.duplicate },
              { id: FlowCanvasContextAction.Delete, label: labels.delete, danger: true },
            ]}
          />
        </div>
      )}
      <ZoomControl
        zoom={viewport.zoom}
        labels={labels.zoom}
        className={styles.zoom}
        onZoomIn={() => void zoomIn()}
        onZoomOut={() => void zoomOut()}
        onFit={() => void fitView({ padding: FLOW_CANVAS_FIT_PADDING })}
      />
      <span aria-live="polite" className={styles.visuallyHidden}>
        {keyboard.targetLabel === null ? '' : labels.connectingTo(keyboard.targetLabel)}
      </span>
    </section>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasSurface {...props} />
    </ReactFlowProvider>
  );
}
