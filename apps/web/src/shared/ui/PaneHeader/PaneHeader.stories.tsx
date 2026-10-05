import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/Button';
import { IconName } from '@/shared/ui/Icon';
import { PaneHeader } from '@/shared/ui/PaneHeader/PaneHeader';
import { PaneHeaderHeight } from '@/shared/ui/PaneHeader/PaneHeader.constants';
import styles from '@/shared/ui/PaneHeader/PaneHeader.module.scss';

const meta = {
  component: PaneHeader,
  decorators: [
    (Story) => (
      <div className={styles.storyPane}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    height: { control: 'select', options: Object.values(PaneHeaderHeight) },
  },
  args: {
    title: 'Olena Kovalenko',
    subtitle: 'Telegram · last message 2 min ago',
    avatar: { initials: 'OK', name: 'Olena Kovalenko' },
    actions: (
      <>
        <Button size={ButtonSize.Sm} variant={ButtonVariant.Secondary}>
          Details
        </Button>
        <Button size={ButtonSize.Sm} icon={IconName.Agent}>
          Hand back to agent
        </Button>
      </>
    ),
  },
} satisfies Meta<typeof PaneHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Chat: Story = { args: { height: PaneHeaderHeight.Chat } };
export const Panel: Story = { args: { height: PaneHeaderHeight.Panel } };
export const TitleOnly: Story = {
  args: { subtitle: null, avatar: null, actions: null, height: PaneHeaderHeight.Panel },
};
export const LongTitleTruncates: Story = {
  args: {
    height: PaneHeaderHeight.Chat,
    title: 'A conversation with a very long contact name that has to be cut with an ellipsis',
  },
};
