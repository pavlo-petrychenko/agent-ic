import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { FlowThumbnail } from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail';
import { FlowThumbnailSize } from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.constants';
import type {
  FlowThumbnailEdge,
  FlowThumbnailNode,
} from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.module.scss';

const COLUMN = 300;
const ROW = 170;

const at = (column: number, row: number) => ({ x: column * COLUMN, y: row * ROW });

const SMALL_NODES: readonly FlowThumbnailNode[] = [
  { id: 'trigger', kind: NodeKind.Trig, label: 'Customer message', ...at(1, 0) },
  { id: 'agent', kind: NodeKind.Agent, label: 'Answer from the FAQ', ...at(1, 1) },
  { id: 'router', kind: NodeKind.Router, label: 'Needs a person?', ...at(1, 2) },
  { id: 'reply', kind: NodeKind.Send, label: 'Send the answer', ...at(0, 3) },
  { id: 'handoff', kind: NodeKind.Esc, label: 'Hand off to a manager', ...at(2, 3) },
];

const SMALL_EDGES: readonly FlowThumbnailEdge[] = [
  { id: 'e1', source: 'trigger', target: 'agent' },
  { id: 'e2', source: 'agent', target: 'router' },
  { id: 'e3', source: 'router', target: 'reply' },
  { id: 'e4', source: 'router', target: 'handoff' },
];

const BIG_NODES: readonly FlowThumbnailNode[] = [
  { id: 'msg', kind: NodeKind.Trig, label: 'Customer message', ...at(1, 0) },
  {
    id: 'schedule',
    kind: NodeKind.Trig,
    icon: IconName.Cal,
    label: 'Every weekday at 09:00',
    ...at(4, 0),
  },
  { id: 'triage', kind: NodeKind.Compl, label: 'Classify the message', ...at(1, 1) },
  { id: 'intent', kind: NodeKind.Router, label: 'What does the customer want?', ...at(1, 2) },
  { id: 'menu', kind: NodeKind.Send, label: 'Show the menu buttons', ...at(0, 3) },
  { id: 'faq', kind: NodeKind.Agent, label: 'Answer from the knowledge base', ...at(1, 3) },
  { id: 'booking', kind: NodeKind.Agent, label: 'Collect the booking details', ...at(2, 3) },
  { id: 'check', kind: NodeKind.Api, label: 'Check free tables', ...at(2, 4) },
  { id: 'par', kind: NodeKind.Par, label: 'Check in parallel', ...at(3, 1) },
  { id: 'orders', kind: NodeKind.Api, label: 'Load recent orders', ...at(3, 2) },
  { id: 'score', kind: NodeKind.Compl, label: 'Score the lead', ...at(4, 2) },
  { id: 'found', kind: NodeKind.Router, label: 'Table found?', ...at(2, 5) },
  { id: 'confirm', kind: NodeKind.Send, label: 'Confirm the booking', ...at(1, 6) },
  { id: 'sorry', kind: NodeKind.Send, label: 'Offer another time', ...at(3, 6) },
  { id: 'person', kind: NodeKind.Router, label: 'Needs a person?', ...at(1, 4) },
  { id: 'handoff', kind: NodeKind.Esc, label: 'Hand off to a manager', ...at(0, 5) },
  { id: 'followup', kind: NodeKind.Agent, label: 'Follow up with quiet customers', ...at(4, 3) },
  {
    id: 'wait',
    kind: NodeKind.Trig,
    icon: IconName.Wait,
    label: 'No reply for 2 hours',
    ...at(5, 0),
  },
];

const BIG_EDGES: readonly FlowThumbnailEdge[] = [
  { id: 'b1', source: 'msg', target: 'triage' },
  { id: 'b2', source: 'triage', target: 'intent' },
  { id: 'b3', source: 'intent', target: 'menu' },
  { id: 'b4', source: 'intent', target: 'faq' },
  { id: 'b5', source: 'intent', target: 'booking' },
  { id: 'b6', source: 'booking', target: 'check' },
  { id: 'b7', source: 'check', target: 'found' },
  { id: 'b8', source: 'found', target: 'confirm' },
  { id: 'b9', source: 'found', target: 'sorry' },
  { id: 'b10', source: 'faq', target: 'person' },
  { id: 'b11', source: 'person', target: 'handoff' },
  { id: 'b12', source: 'schedule', target: 'par' },
  { id: 'b13', source: 'par', target: 'orders' },
  { id: 'b14', source: 'par', target: 'score' },
  { id: 'b15', source: 'score', target: 'followup' },
  { id: 'b16', source: 'wait', target: 'followup' },
];

const SMALL_ARIA_LABEL = 'A flow with five steps: message, agent, decision and two branches';
const BIG_ARIA_LABEL = 'A flow with eighteen steps';

const meta = {
  component: FlowThumbnail,
  args: {
    nodes: SMALL_NODES,
    edges: SMALL_EDGES,
    ariaLabel: SMALL_ARIA_LABEL,
    size: FlowThumbnailSize.Md,
    height: null,
  },
  argTypes: {
    size: { control: 'select', options: Object.values(FlowThumbnailSize) },
    nodes: { control: false },
    edges: { control: false },
  },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className={styles.storyWide}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FlowThumbnail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Small: Story = {};
export const BigFlow: Story = {
  args: { nodes: BIG_NODES, edges: BIG_EDGES, ariaLabel: BIG_ARIA_LABEL },
};
export const HighlightedNode: Story = {
  args: {
    nodes: SMALL_NODES.map((node) => ({ ...node, highlighted: node.id === 'router' })),
  },
};
export const IconOnly: Story = {
  args: {
    nodes: BIG_NODES,
    edges: BIG_EDGES,
    ariaLabel: BIG_ARIA_LABEL,
    size: FlowThumbnailSize.Sm,
  },
};
export const NarrowContainer: Story = {
  args: {
    nodes: BIG_NODES,
    edges: BIG_EDGES,
    ariaLabel: BIG_ARIA_LABEL,
    size: FlowThumbnailSize.Sm,
  },
  decorators: [
    (Story) => (
      <div className={styles.storyNarrow}>
        <Story />
      </div>
    ),
  ],
};
export const FixedHeight: Story = {
  args: { height: 120 },
};
export const InCard: Story = {
  args: {
    nodes: BIG_NODES.map((node) => ({ ...node, highlighted: node.id === 'faq' })),
    edges: BIG_EDGES,
    ariaLabel: BIG_ARIA_LABEL,
    size: FlowThumbnailSize.Sm,
  },
  decorators: [
    (Story) => (
      <div className={styles.storyCard}>
        <Story />
      </div>
    ),
  ],
};
