import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddTile } from '@/shared/ui/AddTile/AddTile';
import { AddTileLayout } from '@/shared/ui/AddTile/AddTile.constants';
import styles from '@/shared/ui/AddTile/AddTile.module.scss';

const meta = {
  component: AddTile,
  args: { label: 'Add source' },
  argTypes: {
    layout: { control: 'select', options: Object.values(AddTileLayout) },
  },
  decorators: [
    (Story) => (
      <div className={styles.storyGrid}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AddTile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Row: Story = { args: { layout: AddTileLayout.Row } };
export const Tile: Story = {
  args: { layout: AddTileLayout.Tile, sub: 'PDF, web page or text' },
};
export const TileWithoutSub: Story = { args: { layout: AddTileLayout.Tile } };
export const Disabled: Story = { args: { disabled: true } };
