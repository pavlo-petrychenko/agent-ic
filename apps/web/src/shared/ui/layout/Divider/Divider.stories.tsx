import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from '@/shared/ui/layout/Divider/Divider';
import { DividerOrientation } from '@/shared/ui/layout/Divider/Divider.constants';

const meta = {
  component: Divider,
  argTypes: {
    orientation: { control: 'select', options: Object.values(DividerOrientation) },
  },
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="flex w-64 flex-col gap-3">
      <span>Above</span>
      <Divider {...args} />
      <span>Below</span>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: DividerOrientation.Vertical },
  render: (args) => (
    <div className="flex items-center gap-3">
      <span>Left</span>
      <Divider {...args} />
      <span>Right</span>
    </div>
  ),
};

export const Semantic: Story = {
  args: { decorative: false },
  render: (args) => (
    <div className="flex w-64 flex-col gap-3">
      <span>Section</span>
      <Divider {...args} />
      <span>Section</span>
    </div>
  ),
};
