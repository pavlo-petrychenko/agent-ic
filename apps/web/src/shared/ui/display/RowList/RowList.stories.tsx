import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { NodeKind, TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { RowList } from '@/shared/ui/display/RowList/RowList';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

const meta = {
  component: RowList,
  args: {
    rows: [
      { id: 'order_id', name: 'order_id', meta: 'required' },
      { id: 'email', name: 'email', meta: 'required' },
      { id: 'note', name: 'note', meta: 'optional' },
    ],
  },
  argTypes: { onRowSelect: { action: 'row selected' } },
} satisfies Meta<typeof RowList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ProportionalNames: Story = {
  args: {
    mono: false,
    rows: [
      { id: 'a', name: 'Opening hours', meta: 'text' },
      { id: 'b', name: 'Delivery area', meta: 'text' },
    ],
  },
};

export const WithLeading: Story = {
  args: {
    mono: false,
    rows: [
      {
        id: 'workspace',
        name: 'Create the workspace',
        leading: <NodeTile kind={NodeKind.Ok} size={TileSize.Sm} icon={IconName.Check} />,
        meta: 'done',
      },
      {
        id: 'team',
        name: 'Invite your team',
        leading: <NodeTile kind={NodeKind.Neutral} size={TileSize.Sm} icon={IconName.User} />,
      },
    ],
  },
};

export const WithoutMeta: Story = {
  args: {
    rows: [
      { id: 'a', name: 'customer_name' },
      { id: 'b', name: 'customer_email' },
    ],
  },
};

export const Clickable: Story = {
  args: { onRowSelect: () => undefined },
};

export const ClickableWithDisabledRow: Story = {
  args: {
    onRowSelect: () => undefined,
    rows: [
      { id: 'a', name: 'order_id', meta: 'required' },
      { id: 'b', name: 'legacy_id', meta: 'deprecated', disabled: true },
      { id: 'c', name: 'note', meta: 'optional' },
    ],
  },
};
