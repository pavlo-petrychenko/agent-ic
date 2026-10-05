import type { Meta, StoryObj } from '@storybook/react-vite';
import { EdgeLabel } from '@/shared/ui/flow/EdgeLabel/EdgeLabel';
import styles from '@/shared/ui/flow/EdgeLabel/EdgeLabel.module.scss';

const noop = () => undefined;

const meta = {
  component: EdgeLabel,
  args: { text: 'needs_human == true', active: false, onClick: null },
} satisfies Meta<typeof EdgeLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { text: 'else', active: true } };
export const Editable: Story = { args: { onClick: noop } };
export const EditableActive: Story = { args: { text: 'else', active: true, onClick: noop } };
export const AllStates: Story = {
  render: (args) => (
    <div className={styles.storyRow}>
      <EdgeLabel {...args} text="needs_human" />
      <EdgeLabel {...args} text="else" active />
      <EdgeLabel {...args} text="booking_found" onClick={noop} />
    </div>
  ),
};
