import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { NodeHeader } from '@/shared/ui/flow/NodeHeader/NodeHeader';
import styles from '@/shared/ui/flow/NodeHeader/NodeHeader.module.scss';

const meta = {
  component: NodeHeader,
  args: { kind: NodeKind.Agent, overline: 'Agent', name: 'Receptionist' },
  argTypes: {
    kind: { control: 'select', options: Object.values(NodeKind) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyStack}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NodeHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Agent: Story = {};
export const SendMessage: Story = {
  args: { kind: NodeKind.Send, overline: 'Send message', name: 'Confirm booking' },
};
export const Router: Story = {
  args: { kind: NodeKind.Router, overline: 'Decision', name: 'Needs a person?' },
};
export const LongName: Story = {
  args: { name: 'Receptionist that answers every question about opening hours' },
};
export const Invalid: Story = { args: { invalidLabel: 'This step has no prompt' } };
export const Kinds: Story = {
  render: (args) => (
    <>
      {[
        NodeKind.Agent,
        NodeKind.Compl,
        NodeKind.Router,
        NodeKind.Send,
        NodeKind.Api,
        NodeKind.Kb,
        NodeKind.Tool,
      ].map((kind) => (
        <NodeHeader key={kind} {...args} kind={kind} overline={kind} />
      ))}
    </>
  ),
};
