import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { FlowCanvas } from '@/shared/ui/flow/FlowCanvas/FlowCanvas';
import type {
  FlowCanvasConnection,
  FlowCanvasLabels,
  FlowCanvasNode,
  FlowCanvasProps,
  FlowCanvasSelection,
} from '@/shared/ui/flow/FlowCanvas/FlowCanvas.typedefs';
import { FlowNode } from '@/shared/ui/flow/FlowNode/FlowNode';
import { TriggerNode } from '@/shared/ui/flow/TriggerNode/TriggerNode';
import { ToastProvider } from '@/shared/ui/overlays/Toast';

const OUT = 'out';

const labels: FlowCanvasLabels = {
  canvas: 'Flow canvas',
  keyboardHelp: 'Keyboard help',
  port: 'Port',
  zoom: { toolbar: 'Zoom', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fit: 'Fit' },
  deleteConnection: 'Delete connection',
  selectionToolbar: 'Selected steps',
  selectionCount: (count) => `${count} selected`,
  duplicate: 'Duplicate',
  delete: 'Delete',
  clearSelection: 'Clear selection',
  deleted: 'Deleted',
  undo: 'Undo',
  addStep: 'Add step',
  stepActions: 'Step actions',
  connectingTo: (name) => `Connect to ${name}`,
  emptyTitle: 'Start with a trigger',
  emptyDescription: null,
  emptyAction: 'Add a trigger',
};

const triggerNode: FlowCanvasNode = {
  id: 'trigger',
  label: 'Incoming message',
  position: { x: 0, y: 0 },
  hasInPort: false,
  outPorts: [{ id: OUT, ariaLabel: 'Connect from Incoming message' }],
  render: ({ outPorts, selected, faded }) => (
    <TriggerNode title="Incoming message" selected={selected} faded={faded} outPort={outPorts} />
  ),
};

const stepNode = (id: string, name: string): FlowCanvasNode => ({
  id,
  label: name,
  position: { x: 0, y: 200 },
  hasInPort: true,
  outPorts: [{ id: OUT, ariaLabel: `Connect from ${name}` }],
  render: ({ inPort, outPorts, selected, faded }) => (
    <FlowNode
      kind={NodeKind.Agent}
      overline="Agent"
      name={name}
      selected={selected}
      faded={faded}
      inPort={inPort}
      outPorts={outPorts}
    />
  ),
});

const NO_SELECTION: FlowCanvasSelection = { nodeIds: [], edgeIds: [] };

const createProps = (overrides: Partial<FlowCanvasProps> = {}): FlowCanvasProps => ({
  nodes: [triggerNode, stepNode('agent', 'Receptionist'), stepNode('reply', 'Send reply')],
  edges: [],
  selection: NO_SELECTION,
  viewport: { x: 0, y: 0, zoom: 1 },
  labels,
  addStepItems: [],
  canConnect: (source, target) => source !== target && target !== 'trigger',
  onViewportChange: vi.fn<FlowCanvasProps['onViewportChange']>(),
  onNodesMove: vi.fn<FlowCanvasProps['onNodesMove']>(),
  onSelectionChange: vi.fn<FlowCanvasProps['onSelectionChange']>(),
  onConnect: vi.fn<(connection: FlowCanvasConnection) => void>(),
  onDelete: vi.fn<FlowCanvasProps['onDelete']>(),
  onUndo: vi.fn<() => void>(),
  onRedo: vi.fn<() => void>(),
  onDuplicate: vi.fn<FlowCanvasProps['onDuplicate']>(),
  onOpenNode: vi.fn<FlowCanvasProps['onOpenNode']>(),
  onPaletteDrop: vi.fn<FlowCanvasProps['onPaletteDrop']>(),
  onAddStep: vi.fn<FlowCanvasProps['onAddStep']>(),
  onAddTrigger: vi.fn<() => void>(),
  ...overrides,
});

const renderCanvas = (props: FlowCanvasProps) =>
  render(
    <ToastProvider closeLabel="Close">
      <FlowCanvas {...props} />
    </ToastProvider>,
  );

describe('FlowCanvas', () => {
  it('is a named region that renders every node through its render function', () => {
    renderCanvas(createProps());

    const canvas = screen.getByRole('region', { name: 'Flow canvas' });
    expect(within(canvas).getByLabelText('Incoming message')).toBeInTheDocument();
    expect(within(canvas).getByLabelText('Receptionist')).toBeInTheDocument();
  });

  it('shows the empty state and asks for a trigger', async () => {
    const props = createProps({ nodes: [] });
    renderCanvas(props);

    await userEvent.click(screen.getByRole('button', { name: 'Add a trigger' }));

    expect(screen.getByRole('heading', { name: 'Start with a trigger' })).toBeInTheDocument();
    expect(props.onAddTrigger).toHaveBeenCalledOnce();
  });

  it('docks the zoom control and disables it at the limits', () => {
    renderCanvas(createProps({ viewport: { x: 0, y: 0, zoom: 2 } }));

    expect(screen.getByRole('toolbar', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
  });

  it('opens the focused node with Enter', async () => {
    const props = createProps();
    renderCanvas(props);

    screen.getByLabelText('Receptionist').focus();
    await userEvent.keyboard('{Enter}');

    expect(props.onOpenNode).toHaveBeenCalledWith('agent');
  });

  it('deletes the selection and offers to undo it', async () => {
    const selection = { nodeIds: ['agent'], edgeIds: [] };
    const props = createProps({ selection });
    renderCanvas(props);

    screen.getByRole('region', { name: 'Flow canvas' }).focus();
    await userEvent.keyboard('{Delete}');

    expect(props.onDelete).toHaveBeenCalledWith(selection);
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(props.onUndo).toHaveBeenCalledOnce();
  });

  it('reports undo, redo and duplicate shortcuts', async () => {
    const selection = { nodeIds: ['agent'], edgeIds: [] };
    const props = createProps({ selection });
    renderCanvas(props);

    screen.getByRole('region', { name: 'Flow canvas' }).focus();
    await userEvent.keyboard('{Meta>}z{/Meta}{Meta>}{Shift>}z{/Shift}{/Meta}{Meta>}d{/Meta}');

    expect(props.onUndo).toHaveBeenCalledOnce();
    expect(props.onRedo).toHaveBeenCalledOnce();
    expect(props.onDuplicate).toHaveBeenCalledWith(selection);
  });

  it('shows the selection bar for two or more selected nodes', async () => {
    const selection = { nodeIds: ['agent', 'reply'], edgeIds: [] };
    const props = createProps({ selection });
    renderCanvas(props);

    const bar = screen.getByRole('toolbar', { name: 'Selected steps' });
    expect(bar).toHaveTextContent('2 selected');

    await userEvent.click(within(bar).getByRole('button', { name: 'Duplicate' }));
    expect(props.onDuplicate).toHaveBeenCalledWith(selection);
  });

  it('connects from a port by keyboard, skipping nodes that cannot accept', async () => {
    const props = createProps();
    renderCanvas(props);

    screen.getByLabelText('Connect from Incoming message').focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Connect to Receptionist')).toBeInTheDocument();

    await userEvent.keyboard('{ArrowRight}{Enter}');

    expect(props.onConnect).toHaveBeenCalledWith({
      source: 'trigger',
      sourcePort: OUT,
      target: 'reply',
    });
  });

  it('cancels a keyboard connection with Escape', async () => {
    const props = createProps();
    renderCanvas(props);

    screen.getByLabelText('Connect from Incoming message').focus();
    await userEvent.keyboard('{Enter}{Escape}');

    expect(screen.queryByText('Connect to Receptionist')).toBeNull();
    expect(props.onConnect).not.toHaveBeenCalled();
  });
});
