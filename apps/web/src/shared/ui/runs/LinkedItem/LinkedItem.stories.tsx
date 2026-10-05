import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { LinkedItem } from '@/shared/ui/runs/LinkedItem/LinkedItem';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/runs/LinkedItem/LinkedItem.module.scss';

const meta = {
  component: LinkedItem,
  decorators: [
    withMemoryRouter,
    (Story) => (
      <div className={styles.storyItem}>
        <Story />
      </div>
    ),
  ],
  args: {
    to: '/auth/login',
    children: (
      <>
        Started linked run <strong>create_booking</strong> succeeded
      </>
    ),
  },
  argTypes: {
    kind: { control: 'select', options: Object.values(NodeKind) },
    icon: { control: 'select', options: Object.values(IconName) },
  },
} satisfies Meta<typeof LinkedItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const OtherKind: Story = {
  args: {
    kind: NodeKind.Api,
    icon: IconName.Api,
    children: (
      <>
        Called <strong>POST /bookings</strong> and got a 502
      </>
    ),
  },
};
export const Dark: Story = { globals: { theme: ResolvedTheme.Dark } };
