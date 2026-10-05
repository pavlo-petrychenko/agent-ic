import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { WidgetPreview } from '@/shared/ui/chat/WidgetPreview/WidgetPreview';
import { WidgetPreviewMessageFrom } from '@/shared/ui/chat/WidgetPreview/WidgetPreview.constants';
import type { WidgetPreviewProps } from '@/shared/ui/chat/WidgetPreview/WidgetPreview.typedefs';
import styles from '@/shared/ui/chat/WidgetPreview/WidgetPreview.module.scss';

const TEAL = '#0f6b6b';
const BLUE = '#2f5bd3';
const VIOLET = '#6d4fb3';

const meta = {
  component: WidgetPreview,
  args: {
    stageLabel: 'Live preview',
    name: 'Salon assistant',
    subtitle: 'Usually replies in a minute',
    initials: 'SA',
    accent: TEAL,
    messages: [
      { from: WidgetPreviewMessageFrom.Bot, text: 'Hi! I am the salon assistant. How can I help?' },
      { from: WidgetPreviewMessageFrom.User, text: 'Can I move my haircut to Friday?' },
    ],
    typingLabel: null,
    open: true,
    onToggle: () => undefined,
    openLabel: 'Open chat',
    closeLabel: 'Close chat',
    composerPlaceholder: 'Write a message…',
    composerLabel: 'Message',
    sendLabel: 'Send',
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WidgetPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

function ToggleablePreview(props: WidgetPreviewProps) {
  const [open, setOpen] = useState(props.open);

  return (
    <WidgetPreview
      {...props}
      open={open}
      onToggle={() => {
        setOpen((current) => !current);
      }}
    />
  );
}

export const Open: Story = {};
export const Closed: Story = { args: { open: false } };
export const Interactive: Story = { render: (args) => <ToggleablePreview {...args} /> };
export const Typing: Story = { args: { typingLabel: 'Salon assistant is typing…' } };
export const WithoutSubtitle: Story = { args: { subtitle: null } };
export const CustomerBlue: Story = { args: { accent: BLUE } };
export const CustomerViolet: Story = { args: { accent: VIOLET } };
export const LongConversation: Story = {
  args: {
    messages: [
      { from: WidgetPreviewMessageFrom.Bot, text: 'Hi! I am the salon assistant. How can I help?' },
      { from: WidgetPreviewMessageFrom.User, text: 'Can I move my haircut to Friday?' },
      { from: WidgetPreviewMessageFrom.Bot, text: 'Friday has a free slot at 11:00 or 15:30.' },
      { from: WidgetPreviewMessageFrom.User, text: '11:00 please.' },
      { from: WidgetPreviewMessageFrom.Bot, text: 'Done. See you on Friday at 11:00.' },
    ],
  },
};
