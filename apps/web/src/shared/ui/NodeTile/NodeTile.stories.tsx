import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { NodeTile } from '@/shared/ui/NodeTile/NodeTile';
import { NodeKind, TileSize } from '@/shared/ui/NodeTile/NodeTile.constants';
import styles from '@/shared/ui/NodeTile/NodeTile.module.scss';

const meta = {
  component: NodeTile,
  args: { kind: NodeKind.Agent, size: TileSize.Md, 'aria-label': 'Agent' },
  argTypes: {
    kind: { control: 'select', options: Object.values(NodeKind) },
    size: { control: 'select', options: Object.values(TileSize) },
    icon: { control: 'select', options: [null, ...Object.values(IconName)] },
  },
} satisfies Meta<typeof NodeTile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithLabel: Story = { args: { label: 'Support agent', 'aria-label': undefined } };
export const CustomIcon: Story = { args: { kind: NodeKind.Tool, icon: IconName.Key } };
export const Accent: Story = { args: { kind: NodeKind.Accent, 'aria-label': 'agent-ic' } };
export const AllSizes: Story = {
  render: (args) => (
    <div className={styles.storyRow}>
      {Object.values(TileSize).map((size) => (
        <NodeTile key={size} {...args} size={size} />
      ))}
    </div>
  ),
};
export const AllKinds: Story = {
  render: (args) => (
    <div className={styles.storyGrid}>
      {Object.values(NodeKind).map((kind) => (
        <NodeTile key={kind} {...args} kind={kind} label={kind} aria-label={undefined} />
      ))}
    </div>
  ),
};
