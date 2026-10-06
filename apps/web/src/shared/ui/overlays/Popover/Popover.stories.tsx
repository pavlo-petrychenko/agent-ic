import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Menu } from '@/shared/ui/overlays/Menu/Menu';
import type { MenuItem } from '@/shared/ui/overlays/Menu/Menu.typedefs';
import { Popover } from '@/shared/ui/overlays/Popover/Popover';
import { PopoverAlign } from '@/shared/ui/overlays/Popover/Popover.constants';
import type { PopoverProps } from '@/shared/ui/overlays/Popover/Popover.typedefs';

const STATUS_ITEMS: readonly MenuItem[] = [
  { id: 'all', label: 'All conversations' },
  { id: 'open', label: 'Needs you', hint: '4' },
  { id: 'live', label: 'Live', hint: '12' },
  { id: 'closed', label: 'Closed', disabled: true },
];

function ControlledPopover(props: PopoverProps) {
  const [open, setOpen] = useState(props.open);
  return (
    <Popover
      {...props}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        props.onOpenChange(next);
      }}
    />
  );
}

function MenuPopover(props: PopoverProps) {
  const [open, setOpen] = useState(props.open);
  const [selectedId, setSelectedId] = useState('all');
  return (
    <Popover
      {...props}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        props.onOpenChange(next);
      }}
    >
      <Menu
        items={STATUS_ITEMS}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setOpen(false);
        }}
        ariaLabel="Status"
      />
    </Popover>
  );
}

const meta = {
  component: Popover,
  render: (args) => <ControlledPopover {...args} />,
  args: {
    open: true,
    onOpenChange: () => undefined,
    trigger: <Button variant={ButtonVariant.Secondary}>Open popover</Button>,
    align: PopoverAlign.Start,
    ariaLabel: 'Account',
    children: <p>Signed in as owner@example.com</p>,
  },
  argTypes: {
    align: { control: 'select', options: Object.values(PopoverAlign) },
  },
  decorators: [
    (Story) => (
      <div className="h-64 w-96 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Closed: Story = { args: { open: false } };
export const AlignedEnd: Story = { args: { align: PopoverAlign.End } };
export const AlignedCenter: Story = { args: { align: PopoverAlign.Center } };
export const WithMenu: Story = {
  render: (args) => <MenuPopover {...args} />,
  args: { bare: true, ariaLabel: 'Status filter', children: null },
};
