import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';
import { TableCellLead } from '@/shared/ui/TableCellLead/TableCellLead';
import {
  TableCellLeadKind,
  TableCellLeadSize,
} from '@/shared/ui/TableCellLead/TableCellLead.constants';
import styles from '@/shared/ui/TableCellLead/TableCellLead.module.scss';

const meta = {
  component: TableCellLead,
  args: {
    title: 'Booking assistant',
    subtitle: 'Agent · updated 2 h ago',
    lead: { kind: TableCellLeadKind.Icon, tone: NodeKind.Agent },
  },
  argTypes: {
    size: { control: 'select', options: Object.values(TableCellLeadSize) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TableCellLead>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Icon: Story = {};
export const IconMd: Story = { args: { size: TableCellLeadSize.Md } };
export const Avatar: Story = {
  args: {
    title: 'Olena K.',
    subtitle: 'olena@demo-salon.example',
    lead: { kind: TableCellLeadKind.Avatar, initials: 'OK' },
  },
};
export const WithoutSubtitle: Story = { args: { subtitle: null } };
export const Truncated: Story = {
  args: {
    title: 'Gift card helper for the spring promotion',
    subtitle: 'Tool · answers questions about gift card balances and expiry',
    lead: { kind: TableCellLeadKind.Icon, tone: NodeKind.Tool },
  },
};
export const Dark: Story = { globals: { theme: ResolvedTheme.Dark } };
