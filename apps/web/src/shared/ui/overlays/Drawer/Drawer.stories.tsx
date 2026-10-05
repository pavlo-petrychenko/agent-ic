import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { Drawer } from '@/shared/ui/overlays/Drawer/Drawer';
import type { DrawerProps } from '@/shared/ui/overlays/Drawer/Drawer.typedefs';

const WIDE_WIDTH = 420;

function DrawerDemo(props: DrawerProps) {
  const [open, setOpen] = useState(props.open);
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    props.onOpenChange(next);
  };

  return (
    <div className="flex h-96 w-full items-start p-4">
      <Button variant={ButtonVariant.Secondary} onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <Drawer {...props} open={open} onOpenChange={handleOpenChange}>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <strong>Node settings</strong>
            <IconButton
              icon={IconName.X}
              label="Close"
              size={IconButtonSize.Sm}
              onClick={() => handleOpenChange(false)}
            />
          </div>
          <p>The same content is a docked panel at 1280 and wider.</p>
        </div>
      </Drawer>
    </div>
  );
}

const meta = {
  component: Drawer,
  render: (args) => <DrawerDemo {...args} />,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    onOpenChange: () => undefined,
    ariaLabel: 'Node settings',
    children: null,
  },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};
export const Closed: Story = { args: { open: false } };
export const Wide: Story = {
  args: { width: WIDE_WIDTH, ariaLabel: 'Details' },
};
