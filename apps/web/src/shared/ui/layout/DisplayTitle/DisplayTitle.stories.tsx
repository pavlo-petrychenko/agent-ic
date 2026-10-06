import type { Meta, StoryObj } from '@storybook/react-vite';
import { DisplayTitle } from '@/shared/ui/layout/DisplayTitle/DisplayTitle';

const meta = {
  component: DisplayTitle,
  args: {
    title: 'Connect your first channel',
    subtitle: 'Choose where customers will talk to your agent. You can add more channels later.',
  },
} satisfies Meta<typeof DisplayTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithSubtitle: Story = {};
export const TitleOnly: Story = { args: { subtitle: null } };
export const LongSubtitle: Story = {
  args: {
    subtitle:
      'A long supporting sentence that wraps once it reaches the lead width, so the measure of the text stays comfortable to read on wide screens in both themes.',
  },
};
