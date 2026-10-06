import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusDot } from '@/shared/ui/display/StatusDot/StatusDot';
import { StatusKind } from '@/shared/ui/display/StatusDot/StatusDot.constants';
import styles from '@/shared/ui/display/StatusDot/StatusDot.module.scss';

const meta = {
  component: StatusDot,
  args: { kind: StatusKind.Ok },
  argTypes: {
    kind: { control: 'select', options: Object.values(StatusKind) },
  },
} satisfies Meta<typeof StatusDot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Warn: Story = { args: { kind: StatusKind.Warn } };
export const Err: Story = { args: { kind: StatusKind.Err } };
export const Idle: Story = { args: { kind: StatusKind.Idle } };
export const Running: Story = { args: { kind: StatusKind.Run } };
export const Labelled: Story = { args: { label: 'Connected' } };
export const RunningLabelled: Story = { args: { kind: StatusKind.Run, label: 'Indexing' } };
export const AllKindsLabelled: Story = {
  render: (args) => (
    <div className={styles.storyRow}>
      {Object.values(StatusKind).map((kind) => (
        <StatusDot key={kind} {...args} kind={kind} label={kind} />
      ))}
    </div>
  ),
};
export const AllKinds: Story = {
  render: (args) => (
    <div className={styles.storyRow}>
      {Object.values(StatusKind).map((kind) => (
        <span key={kind} className={styles.storyItem}>
          <StatusDot {...args} kind={kind} />
          {kind}
        </span>
      ))}
    </div>
  ),
};
