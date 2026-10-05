import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { WidgetComposer } from '@/shared/ui/chat/WidgetComposer/WidgetComposer';
import type { WidgetComposerProps } from '@/shared/ui/chat/WidgetComposer/WidgetComposer.typedefs';
import styles from '@/shared/ui/chat/WidgetComposer/WidgetComposer.module.scss';

const TEAL = '#0f6b6b';
const BLUE = '#2f5bd3';

const meta = {
  component: WidgetComposer,
  args: {
    value: '',
    onChange: () => undefined,
    onSend: () => undefined,
    attach: null,
    placeholder: 'Write a message…',
    messageLabel: 'Message',
    sendLabel: 'Send',
    accent: TEAL,
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WidgetComposer>;

export default meta;

type Story = StoryObj<typeof meta>;

function TypingComposer(props: WidgetComposerProps) {
  const [value, setValue] = useState(props.value);

  return (
    <WidgetComposer
      {...props}
      value={value}
      onChange={setValue}
      onSend={() => {
        setValue('');
      }}
    />
  );
}

export const Empty: Story = {};
export const Interactive: Story = { render: (args) => <TypingComposer {...args} /> };
export const WithText: Story = { args: { value: 'Can I move my haircut to Friday?' } };
export const Focused: Story = {
  render: (args) => <TypingComposer {...args} />,
  play: async ({ canvasElement }) => {
    canvasElement.querySelector('textarea')?.focus();
  },
};
export const Sending: Story = {
  args: { value: 'Can I move my haircut to Friday?', sending: true },
};
export const Disabled: Story = {
  args: { value: 'Can I move my haircut to Friday?', disabled: true },
};
export const WithAttach: Story = {
  args: { attach: { label: 'Attach', onAttach: () => undefined } },
};
export const CustomerBlue: Story = { args: { value: 'Hello', accent: BLUE } };
