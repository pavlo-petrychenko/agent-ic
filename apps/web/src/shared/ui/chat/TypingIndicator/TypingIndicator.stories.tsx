import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatBubbleView } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import { TypingIndicator } from '@/shared/ui/chat/TypingIndicator/TypingIndicator';

const meta = {
  component: TypingIndicator,
  args: { label: 'Salon assistant is typing…' },
  argTypes: {
    view: { control: 'select', options: Object.values(ChatBubbleView) },
  },
} satisfies Meta<typeof TypingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const InWidget: Story = { args: { view: ChatBubbleView.Widget } };
