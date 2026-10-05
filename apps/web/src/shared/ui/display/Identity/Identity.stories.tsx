import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '@/shared/ui/display/Avatar/Avatar';
import { Identity } from '@/shared/ui/display/Identity/Identity';
import { IdentitySize } from '@/shared/ui/display/Identity/Identity.constants';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { NodeKind, TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import styles from '@/shared/ui/display/Identity/Identity.module.scss';

const meta = {
  component: Identity,
  args: {
    name: 'Anna Kovalenko',
    sub: 'Telegram · Booking assistant v6',
    size: IdentitySize.Md,
    lead: <Avatar initials="AK" />,
  },
  argTypes: {
    size: { control: 'select', options: Object.values(IdentitySize) },
  },
} satisfies Meta<typeof Identity>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Md: Story = {};
export const Sm: Story = {
  args: {
    size: IdentitySize.Sm,
    name: 'Booking assistant',
    sub: 'Agent',
    lead: <NodeTile kind={NodeKind.Agent} size={TileSize.Sm} />,
  },
};
export const WithoutSub: Story = { args: { sub: null } };
export const Truncated: Story = {
  render: (args) => (
    <div className={styles.storyColumn}>
      <Identity
        {...args}
        name="A very long customer name that does not fit into one line at all"
        sub="Telegram · Booking assistant with an equally long agent name v6"
      />
    </div>
  ),
};
