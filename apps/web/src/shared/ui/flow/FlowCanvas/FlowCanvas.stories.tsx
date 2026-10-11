import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { TagKind } from '@/shared/ui/display/Tag/Tag.constants';
import { FlowCanvas } from '@/shared/ui/flow/FlowCanvas/FlowCanvas';
import type {
  FlowCanvasEdge,
  FlowCanvasLabels,
  FlowCanvasNode,
  FlowCanvasPoint,
  FlowCanvasSelection,
  FlowCanvasViewport,
} from '@/shared/ui/flow/FlowCanvas/FlowCanvas.typedefs';
import { FlowNode } from '@/shared/ui/flow/FlowNode/FlowNode';
import { FlowNodeSize } from '@/shared/ui/flow/FlowNode/FlowNode.constants';
import type { FlowNodeProps } from '@/shared/ui/flow/FlowNode/FlowNode.typedefs';
import { TriggerNode } from '@/shared/ui/flow/TriggerNode/TriggerNode';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { ToastProvider } from '@/shared/ui/overlays/Toast';
import styles from '@/shared/ui/flow/FlowCanvas/FlowCanvas.module.scss';

interface DemoStep {
  id: string;
  position: FlowCanvasPoint;
  render: FlowCanvasNode['render'];
  label: string;
  trigger: boolean;
  outPorts: FlowCanvasNode['outPorts'];
}

interface DemoGraph {
  steps: readonly DemoStep[];
  edges: readonly FlowCanvasEdge[];
}

const OUT = 'out';
const DUPLICATE_OFFSET = 40;
const START_VIEWPORT: FlowCanvasViewport = { x: 120, y: 32, zoom: 0.85 };
const NO_SELECTION: FlowCanvasSelection = { nodeIds: [], edgeIds: [] };

const labels: FlowCanvasLabels = {
  canvas: 'Flow canvas',
  keyboardHelp: 'Tab moves between steps, Enter opens a step, Delete removes the selection.',
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
  emptyDescription: 'A trigger decides when this agent runs.',
  emptyAction: 'Add a trigger',
};

const addStepItems = [
  { id: 'agent', label: 'Agent', kind: NodeKind.Agent },
  { id: 'send', label: 'Send message', kind: NodeKind.Send },
  { id: 'api', label: 'API request', kind: NodeKind.Api },
  { id: 'router', label: 'Decision', kind: NodeKind.Router },
  { id: 'esc', label: 'Hand to a person', kind: NodeKind.Esc },
];

const outPort = (ariaLabel: string) => [{ id: OUT, ariaLabel }];

const trigger = (
  id: string,
  position: FlowCanvasPoint,
  title: string,
  subtitle: string,
  icon: IconName,
): DemoStep => ({
  id,
  position,
  label: title,
  trigger: true,
  outPorts: outPort(`Connect from ${title}`),
  render: ({ outPorts, selected, faded }) => (
    <TriggerNode
      title={title}
      subtitle={subtitle}
      icon={icon}
      selected={selected}
      faded={faded}
      outPort={outPorts}
    />
  ),
});

const step = (
  id: string,
  position: FlowCanvasPoint,
  props: Omit<FlowNodeProps, 'selected' | 'faded' | 'inPort' | 'outPorts'>,
  ports: FlowCanvasNode['outPorts'] = outPort(`Connect from ${props.name}`),
): DemoStep => ({
  id,
  position,
  label: props.name,
  trigger: false,
  outPorts: ports,
  render: ({ inPort, outPorts, selected, faded }) => (
    <FlowNode
      {...props}
      selected={selected}
      faded={faded}
      inPort={inPort}
      outPorts={ports.length > 0 ? outPorts : null}
    />
  ),
});

const exampleGraph: DemoGraph = {
  steps: [
    trigger('message', { x: 0, y: 0 }, 'Incoming message', 'Telegram · Web widget', IconName.Msg),
    trigger('schedule', { x: 320, y: 0 }, 'Schedule', 'Daily 18:00', IconName.Cal),
    step(
      'agent',
      { x: 160, y: 150 },
      {
        kind: NodeKind.Agent,
        overline: 'Agent',
        name: 'Receptionist',
        meta: 'Fast model · answers from the knowledge base',
        chips: [{ id: 'kb', label: 'Opening hours', kind: TagKind.Kb }],
        output: 'reply',
      },
    ),
    step(
      'router',
      { x: 184, y: 380 },
      {
        kind: NodeKind.Router,
        overline: 'Decision',
        name: 'Needs a person?',
        size: FlowNodeSize.Condition,
      },
      [
        { id: 'needs_human', ariaLabel: 'Connect from needs_human', label: 'needs_human' },
        { id: 'else', ariaLabel: 'Connect from else', label: 'else', labelActive: true },
      ],
    ),
    step(
      'escalate',
      { x: 0, y: 520 },
      {
        kind: NodeKind.Esc,
        overline: 'Hand-off',
        name: 'Hand to a person',
        meta: 'Notifies the team in the inbox',
      },
    ),
    step(
      'reply',
      { x: 340, y: 520 },
      {
        kind: NodeKind.Send,
        overline: 'Send message',
        name: 'Send the reply',
        output: 'message_id',
      },
    ),
  ],
  edges: [
    { id: 'e-message-agent', source: 'message', sourcePort: OUT, target: 'agent' },
    { id: 'e-schedule-agent', source: 'schedule', sourcePort: OUT, target: 'agent' },
    { id: 'e-agent-router', source: 'agent', sourcePort: OUT, target: 'router' },
    { id: 'e-router-escalate', source: 'router', sourcePort: 'needs_human', target: 'escalate' },
    { id: 'e-router-reply', source: 'router', sourcePort: 'else', target: 'reply', active: true },
  ],
};

const reaches = (edges: readonly FlowCanvasEdge[], from: string, to: string): boolean => {
  const queue = [from];
  const seen = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || seen.has(current)) {
      continue;
    }
    if (current === to) {
      return true;
    }
    seen.add(current);
    queue.push(...edges.filter((edge) => edge.source === current).map((edge) => edge.target));
  }
  return false;
};

function DemoCanvas({
  initial,
  initialSelection,
}: {
  initial: DemoGraph;
  initialSelection: FlowCanvasSelection;
}) {
  const [graph, setGraph] = useState(initial);
  const [history, setHistory] = useState<readonly DemoGraph[]>([]);
  const [future, setFuture] = useState<readonly DemoGraph[]>([]);
  const [selection, setSelection] = useState(initialSelection);
  const [viewport, setViewport] = useState(START_VIEWPORT);

  const commit = (next: DemoGraph) => {
    setHistory((past) => [...past, graph]);
    setFuture([]);
    setGraph(next);
  };

  const triggers = new Set(graph.steps.filter((item) => item.trigger).map((item) => item.id));

  return (
    <FlowCanvas
      nodes={graph.steps.map((item) => ({
        id: item.id,
        label: item.label,
        position: item.position,
        hasInPort: !item.trigger,
        outPorts: item.outPorts,
        render: item.render,
      }))}
      edges={graph.edges}
      selection={selection}
      viewport={viewport}
      labels={labels}
      addStepItems={addStepItems}
      canConnect={(source, target) =>
        source !== target && !triggers.has(target) && !reaches(graph.edges, target, source)
      }
      onViewportChange={setViewport}
      onSelectionChange={setSelection}
      onNodesMove={(moves) =>
        setGraph((current) => ({
          ...current,
          steps: current.steps.map((item) => {
            const move = moves.find((candidate) => candidate.id === item.id);
            return move === undefined ? item : { ...item, position: move.position };
          }),
        }))
      }
      onConnect={(connection) =>
        commit({
          ...graph,
          edges: [
            ...graph.edges,
            {
              id: `e-${connection.source}-${connection.sourcePort}-${connection.target}`,
              ...connection,
            },
          ],
        })
      }
      onDelete={(target) => {
        commit({
          steps: graph.steps.filter((item) => !target.nodeIds.includes(item.id)),
          edges: graph.edges.filter(
            (edge) =>
              !target.edgeIds.includes(edge.id) &&
              !target.nodeIds.includes(edge.source) &&
              !target.nodeIds.includes(edge.target),
          ),
        });
        setSelection(NO_SELECTION);
      }}
      onUndo={() => {
        const previous = history.at(-1);
        if (previous !== undefined) {
          setFuture((next) => [graph, ...next]);
          setHistory((past) => past.slice(0, -1));
          setGraph(previous);
        }
      }}
      onRedo={() => {
        const next = future[0];
        if (next !== undefined) {
          setHistory((past) => [...past, graph]);
          setFuture((rest) => rest.slice(1));
          setGraph(next);
        }
      }}
      onDuplicate={(target) =>
        commit({
          ...graph,
          steps: [
            ...graph.steps,
            ...graph.steps
              .filter((item) => target.nodeIds.includes(item.id))
              .map((item) => ({
                ...item,
                id: `${item.id}-copy-${graph.steps.length}`,
                position: {
                  x: item.position.x + DUPLICATE_OFFSET,
                  y: item.position.y + DUPLICATE_OFFSET,
                },
              })),
          ],
        })
      }
      onOpenNode={(id) => setSelection({ nodeIds: [id], edgeIds: [] })}
      onPaletteDrop={() => undefined}
      onAddStep={() => undefined}
      onAddTrigger={() => commit(exampleGraph)}
    />
  );
}

const meta = {
  component: DemoCanvas,
  args: { initial: exampleGraph, initialSelection: NO_SELECTION },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <ToastProvider closeLabel="Close">
        <div className={styles.storyFrame}>
          <Story />
        </div>
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof DemoCanvas>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ExampleFlow: Story = {};
export const MultipleSelected: Story = {
  args: { initialSelection: { nodeIds: ['escalate', 'reply'], edgeIds: [] } },
};
export const SelectedEdge: Story = {
  args: { initialSelection: { nodeIds: [], edgeIds: ['e-agent-router'] } },
};
export const Empty: Story = { args: { initial: { steps: [], edges: [] } } };
