import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlowPort } from '@/shared/ui/flow/FlowPort/FlowPort';
import { FlowPortDirection, FlowPortState } from '@/shared/ui/flow/FlowPort/FlowPort.constants';
import { TriggerNode } from '@/shared/ui/flow/TriggerNode/TriggerNode';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/flow/TriggerNode/TriggerNode.module.scss';

const outPort = <FlowPort direction={FlowPortDirection.Out} state={FlowPortState.Hidden} />;

const meta = {
  component: TriggerNode,
  args: { title: 'Incoming message', subtitle: 'Telegram · Web widget', outPort },
  argTypes: {
    icon: { control: 'select', options: Object.values(IconName) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyRow}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TriggerNode>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Faded: Story = { args: { faded: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Schedule: Story = {
  args: { title: 'Schedule', subtitle: 'Daily 18:00', icon: IconName.Cal },
};
export const ExternalEvent: Story = {
  args: { title: 'External event', subtitle: 'order.created', icon: IconName.Bolt },
};
export const AllStates: Story = {
  render: (args) => (
    <>
      <TriggerNode {...args} />
      <TriggerNode {...args} selected />
      <TriggerNode {...args} faded />
      <TriggerNode {...args} disabled />
    </>
  ),
};
