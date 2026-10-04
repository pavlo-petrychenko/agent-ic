import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { Tooltip } from '@/shared/ui/Tooltip/Tooltip';
import { TooltipSide } from '@/shared/ui/Tooltip/Tooltip.constants';

const meta = {
  component: Tooltip,
  args: {
    content: 'Knowledge base',
    side: TooltipSide.Top,
    children: <button type="button">Hover or focus me</button>,
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
    children: (
      <button type="button" aria-label="Settings">
        <Icon name={IconName.Gear} size={16} />
      </button>
    ),
  },
};

export const DisabledReason: Story = {
  args: {
    content: 'Publish the agent first',
    children: (
      <button type="button" aria-disabled="true">
        Share
      </button>
    ),
  },
};
