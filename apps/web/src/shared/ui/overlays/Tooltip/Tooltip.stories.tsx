import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton } from '@/shared/ui/actions/IconButton';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { Tooltip } from '@/shared/ui/overlays/Tooltip/Tooltip';
import { TooltipSide } from '@/shared/ui/overlays/Tooltip/Tooltip.constants';

const meta = {
  component: Tooltip,
  args: {
    content: 'Knowledge base',
    side: TooltipSide.Top,
    children: <Button variant={ButtonVariant.Secondary}>Hover or focus me</Button>,
  },
  argTypes: {
    side: { control: 'select', options: Object.values(TooltipSide) },
  },
  decorators: [
    (Story) => (
      <div className="p-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Top: Story = {};
export const Right: Story = { args: { side: TooltipSide.Right } };
export const Bottom: Story = { args: { side: TooltipSide.Bottom } };
export const Left: Story = { args: { side: TooltipSide.Left } };

export const WithStrongLead: Story = {
  args: {
    content: (
      <>
        <strong>Tokens</strong> · 12,480
      </>
    ),
  },
};

export const IconControl: Story = {
  args: {
    content: 'Settings',
    side: TooltipSide.Right,
    children: <IconButton icon={IconName.Gear} label="Settings" />,
  },
};

export const DisabledReason: Story = {
  args: {
    content: 'Publish the agent first',
    children: (
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      <span tabIndex={0} className="inline-flex">
        <Button variant={ButtonVariant.Secondary} disabled>
          Share
        </Button>
      </span>
    ),
  },
};

export const WithoutArrow: Story = {
  args: { content: 'Agents', side: TooltipSide.Right, arrow: false },
};

export const Multiline: Story = {
  args: {
    multiline: true,
    content:
      'The agent answers only from the knowledge you attach. Anything it cannot find is handed to a person.',
  },
};
