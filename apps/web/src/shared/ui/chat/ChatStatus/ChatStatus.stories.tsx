import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatStatus } from '@/shared/ui/chat/ChatStatus/ChatStatus';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/chat/ChatStatus/ChatStatus.module.scss';

const meta = {
  component: ChatStatus,
  args: { icon: IconName.ToolEvent, text: 'Tool event run is writing the confirmation…' },
  argTypes: {
    icon: { control: 'select', options: Object.values(IconName) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatStatus>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Done: Story = {};
export const InProgress: Story = { args: { inProgress: true } };
