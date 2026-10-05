import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/Button';
import { PaneBar } from '@/shared/ui/PaneBar/PaneBar';
import { PaneBarEdge, PaneBarTone } from '@/shared/ui/PaneBar/PaneBar.constants';
import styles from '@/shared/ui/PaneBar/PaneBar.module.scss';

const meta = {
  component: PaneBar,
  decorators: [
    (Story) => (
      <div className={styles.storyPane}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    edge: { control: 'select', options: Object.values(PaneBarEdge) },
    tone: { control: 'select', options: Object.values(PaneBarTone) },
  },
  args: { children: 'Replies are sent as the operator' },
} satisfies Meta<typeof PaneBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TopEdge: Story = {};
export const BottomEdge: Story = { args: { edge: PaneBarEdge.Bottom } };
export const White: Story = { args: { tone: PaneBarTone.White } };
export const NoBackground: Story = { args: { tone: PaneBarTone.None } };
export const SoftLine: Story = { args: { softLine: true } };
export const Row: Story = {
  args: {
    row: true,
    children: (
      <>
        <span>3 chats waiting</span>
        <Button size={ButtonSize.Sm} variant={ButtonVariant.Secondary}>
          Assign to me
        </Button>
      </>
    ),
  },
};
export const PushedToBottom: Story = { args: { push: true } };
