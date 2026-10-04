import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, ButtonVariant } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer/Drawer';
import type { DrawerProps } from '@/shared/ui/Drawer/Drawer.typedefs';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';

const WIZARD_PREVIEW_WIDTH = 380;
const STORY_ICON_SIZE = 14;

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
            <button type="button" aria-label="Close" onClick={() => handleOpenChange(false)}>
              <Icon name={IconName.X} size={STORY_ICON_SIZE} />
            </button>
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
export const WizardPreviewWidth: Story = {
  args: { width: WIZARD_PREVIEW_WIDTH, ariaLabel: 'Preview' },
};
