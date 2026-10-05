import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalloutTone } from '@/shared/ui/display/Callout/Callout.constants';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { TagKind } from '@/shared/ui/display/Tag/Tag.constants';
import { FlowNode } from '@/shared/ui/flow/FlowNode/FlowNode';
import { FlowNodeSize } from '@/shared/ui/flow/FlowNode/FlowNode.constants';
import { FlowPort } from '@/shared/ui/flow/FlowPort/FlowPort';
import { FlowPortDirection, FlowPortState } from '@/shared/ui/flow/FlowPort/FlowPort.constants';
import styles from '@/shared/ui/flow/FlowNode/FlowNode.module.scss';

const meta = {
  component: FlowNode,
  args: {
    kind: NodeKind.Agent,
    overline: 'Agent',
    name: 'Receptionist',
    meta: 'Fast model · answers from the knowledge base',
    chips: [
      { id: 'kb', label: 'Opening hours', kind: TagKind.Kb },
      { id: 'tool', label: 'book_table', kind: TagKind.Tool },
    ],
    output: 'reply',
  },
  argTypes: {
    kind: { control: 'select', options: Object.values(NodeKind) },
    size: { control: 'select', options: Object.values(FlowNodeSize) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyPad}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FlowNode>;

export default meta;

type Story = StoryObj<typeof meta>;

const ports = {
  inPort: <FlowPort direction={FlowPortDirection.In} state={FlowPortState.Hidden} />,
  outPorts: <FlowPort direction={FlowPortDirection.Out} state={FlowPortState.Hidden} />,
};

export const Default: Story = {};
export const Selected: Story = { args: { selected: true, ...ports } };
export const WithPorts: Story = { args: ports };
export const Faded: Story = { args: { faded: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = {
  args: { invalidLabel: 'This step has no prompt', output: null, chips: [] },
};
export const WithCallout: Story = {
  args: {
    kind: NodeKind.Compl,
    overline: 'Guard',
    name: 'Check the answer',
    meta: 'Fast model · records score only',
    chips: [],
    output: 'score',
    callout: { tone: CalloutTone.Warn, text: 'Runs on every reply and adds about 300 ms.' },
  },
};
export const SendMessage: Story = {
  args: {
    kind: NodeKind.Send,
    overline: 'Send message',
    name: 'Confirm booking',
    meta: null,
    chips: [],
    output: null,
  },
};
export const Condition: Story = {
  args: {
    kind: NodeKind.Router,
    overline: 'Decision',
    name: 'Needs a person?',
    size: FlowNodeSize.Condition,
    inPort: ports.inPort,
    outPorts: (
      <>
        <FlowPort
          direction={FlowPortDirection.Out}
          state={FlowPortState.Idle}
          label="needs_human"
        />
        <FlowPort direction={FlowPortDirection.Out} state={FlowPortState.Idle} label="else" />
      </>
    ),
  },
};
export const AllStates: Story = {
  render: (args) => (
    <div className={styles.storyRow}>
      <FlowNode {...args} />
      <FlowNode {...args} selected />
      <FlowNode {...args} faded />
      <FlowNode {...args} disabled />
      <FlowNode {...args} invalidLabel="This step has no prompt" />
    </div>
  ),
};
