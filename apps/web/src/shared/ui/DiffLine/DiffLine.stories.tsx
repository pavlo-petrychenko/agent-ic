import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiffLine } from '@/shared/ui/DiffLine/DiffLine';
import { DiffSign } from '@/shared/ui/DiffLine/DiffLine.constants';
import styles from '@/shared/ui/DiffLine/DiffLine.module.scss';

const meta = {
  component: DiffLine,
  args: { sign: DiffSign.Added, signLabel: 'Added', children: 'Node Greeting' },
  argTypes: { sign: { control: 'select', options: Object.values(DiffSign) } },
  decorators: [
    (Story) => (
      <ul className={styles.list}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof DiffLine>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Added: Story = {};
export const Changed: Story = {
  args: { sign: DiffSign.Changed, signLabel: 'Changed', children: 'Node Router' },
};
export const Removed: Story = {
  args: { sign: DiffSign.Removed, signLabel: 'Removed', children: 'Node Collect phone' },
};

export const ChangeSummary: Story = {
  render: () => (
    <>
      <DiffLine sign={DiffSign.Added} signLabel="Added">
        Node <strong>Greeting</strong> with 2 outputs
      </DiffLine>
      <DiffLine sign={DiffSign.Changed} signLabel="Changed">
        Prompt of <strong>Support agent</strong>
      </DiffLine>
      <DiffLine sign={DiffSign.Removed} signLabel="Removed">
        Tool <strong>lookup_order</strong>
      </DiffLine>
    </>
  ),
};
