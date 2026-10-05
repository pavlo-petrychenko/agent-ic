import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { RunNode } from '@/shared/ui/flow/RunNode/RunNode';
import { RunNodeState } from '@/shared/ui/flow/RunNode/RunNode.constants';
import styles from '@/shared/ui/flow/RunNode/RunNode.module.scss';

const meta = {
  component: RunNode,
  args: {
    name: 'Receptionist',
    kind: NodeKind.Agent,
    state: RunNodeState.Running,
    stateLabel: 'running',
  },
  argTypes: {
    kind: { control: 'select', options: Object.values(NodeKind) },
    state: { control: 'select', options: Object.values(RunNodeState) },
  },
  decorators: [
    (Story) => (
      <ul className={styles.storyList}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof RunNode>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Running: Story = {};
export const Done: Story = { args: { state: RunNodeState.Done, stateLabel: 'done' } };
export const Failed: Story = { args: { state: RunNodeState.Failed, stateLabel: 'failed' } };
export const Waiting: Story = { args: { state: RunNodeState.Waiting, stateLabel: 'waiting' } };
export const Skipped: Story = { args: { state: RunNodeState.Skipped, stateLabel: 'not reached' } };
export const LiveRun: Story = {
  render: () => (
    <>
      <RunNode
        name="Incoming message"
        kind={NodeKind.Trig}
        state={RunNodeState.Done}
        stateLabel="done"
      />
      <RunNode
        name="Receptionist"
        kind={NodeKind.Agent}
        state={RunNodeState.Done}
        stateLabel="done"
      />
      <RunNode
        name="Needs a person?"
        kind={NodeKind.Router}
        state={RunNodeState.Running}
        stateLabel="running"
      />
      <RunNode
        name="Book a table"
        kind={NodeKind.Api}
        state={RunNodeState.Failed}
        stateLabel="failed"
      />
      <RunNode
        name="Confirm booking"
        kind={NodeKind.Send}
        state={RunNodeState.Waiting}
        stateLabel="waiting"
      />
      <RunNode
        name="Hand to a person"
        kind={NodeKind.Esc}
        state={RunNodeState.Skipped}
        stateLabel="not reached"
      />
    </>
  ),
};
