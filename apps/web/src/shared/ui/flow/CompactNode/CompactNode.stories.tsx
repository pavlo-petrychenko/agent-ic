import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { CompactNode } from '@/shared/ui/flow/CompactNode/CompactNode';
import { CompactNodeShape } from '@/shared/ui/flow/CompactNode/CompactNode.constants';
import { FlowPort } from '@/shared/ui/flow/FlowPort/FlowPort';
import { FlowPortDirection, FlowPortState } from '@/shared/ui/flow/FlowPort/FlowPort.constants';
import styles from '@/shared/ui/flow/CompactNode/CompactNode.module.scss';

const meta = {
  component: CompactNode,
  args: {
    label: 'Parallel',
    kind: NodeKind.Par,
    inPort: <FlowPort direction={FlowPortDirection.In} state={FlowPortState.Hidden} />,
    outPorts: <FlowPort direction={FlowPortDirection.Out} state={FlowPortState.Hidden} />,
  },
  argTypes: {
    kind: { control: 'select', options: Object.values(NodeKind) },
    shape: { control: 'select', options: Object.values(CompactNodeShape) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyRow}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CompactNode>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Pill: Story = {};
export const Decision: Story = {
  args: { label: 'Booking found?', kind: NodeKind.Router, shape: CompactNodeShape.Card },
};
export const Selected: Story = { args: { selected: true } };
export const Faded: Story = { args: { faded: true } };
export const Disabled: Story = { args: { disabled: true } };
export const AllStates: Story = {
  render: (args) => (
    <>
      <CompactNode {...args} />
      <CompactNode {...args} selected />
      <CompactNode {...args} faded />
      <CompactNode {...args} disabled />
      <CompactNode
        {...args}
        label="Needs a person?"
        kind={NodeKind.Router}
        shape={CompactNodeShape.Card}
      />
      <CompactNode
        {...args}
        label="Needs a person?"
        kind={NodeKind.Router}
        shape={CompactNodeShape.Card}
        selected
      />
    </>
  ),
};
