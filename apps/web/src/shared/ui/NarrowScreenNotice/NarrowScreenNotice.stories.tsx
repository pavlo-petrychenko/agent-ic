import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { NarrowScreenNotice } from '@/shared/ui/NarrowScreenNotice/NarrowScreenNotice';

const meta = {
  component: NarrowScreenNotice,
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Open on a wider screen',
    description: 'Agents needs a window at least 1024 pixels wide.',
  },
} satisfies Meta<typeof NarrowScreenNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TitleOnly: Story = { args: { description: null } };
export const Dark: Story = { globals: { theme: ResolvedTheme.Dark } };
