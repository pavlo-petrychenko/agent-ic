import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Composer } from '@/shared/ui/chat/Composer/Composer';
import type { ComposerProps } from '@/shared/ui/chat/Composer/Composer.typedefs';
import styles from '@/shared/ui/chat/Composer/Composer.module.scss';

const meta = {
  component: Composer,
  args: {
    value: '',
    onChange: () => undefined,
    onSend: () => undefined,
    onRetry: null,
    placeholder: 'Write a message…',
    label: 'Reply',
    sendLabel: 'Send',
    retryLabel: 'Retry',
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Composer>;

export default meta;

type Story = StoryObj<typeof meta>;

function TypingComposer(props: ComposerProps) {
  const [value, setValue] = useState(props.value);

  return (
    <Composer
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
export const WithText: Story = { args: { value: 'Friday at 11:00 works for me.' } };
export const MultiLine: Story = {
  render: (args) => (
    <TypingComposer
      {...args}
      value={'Friday at 11:00 works for me.\nCould you also add a beard trim?\nThank you!'}
    />
  ),
};
export const GrowsThenScrolls: Story = {
  render: (args) => (
    <TypingComposer
      {...args}
      value={Array.from({ length: 9 }, (_, line) => `Line ${line + 1}`).join('\n')}
    />
  ),
};
export const Sending: Story = { args: { value: 'Friday at 11:00 works for me.', sending: true } };
export const Failed: Story = {
  args: {
    error: 'Not delivered — Telegram is unreachable',
    onRetry: () => undefined,
  },
};
export const Disabled: Story = {
  args: { disabled: true, disabledReason: 'Take over the chat to reply' },
};
