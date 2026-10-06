import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatDivider } from '@/shared/ui/chat/ChatDivider/ChatDivider';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/chat/ChatDivider/ChatDivider.module.scss';

const meta = {
  component: ChatDivider,
  args: { text: 'Flow paused since 14:03', icon: IconName.Pause },
  argTypes: {
    icon: { control: 'select', options: [null, ...Object.values(IconName)] },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatDivider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FlowPaused: Story = {};
export const DayChange: Story = { args: { text: 'Today', icon: null } };
