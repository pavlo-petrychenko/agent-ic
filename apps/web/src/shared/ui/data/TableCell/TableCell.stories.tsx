import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { TableCell } from '@/shared/ui/data/TableCell/TableCell';
import { TableCellAlign, TableCellTone } from '@/shared/ui/data/TableCell/TableCell.constants';
import styles from '@/shared/ui/data/TableCell/TableCell.module.scss';

const meta = {
  component: TableCell,
  args: { children: 'Booking basics' },
  argTypes: {
    tone: { control: 'select', options: Object.values(TableCellTone) },
    align: { control: 'select', options: Object.values(TableCellAlign) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TableCell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ink: Story = {};
export const Mute: Story = { args: { tone: TableCellTone.Mute, children: 'Telegram' } };
export const Numeric: Story = {
  args: { tone: TableCellTone.Secondary, align: TableCellAlign.End, mono: true, children: '3.0' },
};
export const Mono: Story = { args: { mono: true, children: 'run_8f3a21' } };
export const Truncated: Story = {
  args: { children: 'Asks for the booking date before checking the calendar' },
};
export const Dark: Story = {
  args: { tone: TableCellTone.Secondary, align: TableCellAlign.End, mono: true, children: '3.0' },
  globals: { theme: ResolvedTheme.Dark },
};
