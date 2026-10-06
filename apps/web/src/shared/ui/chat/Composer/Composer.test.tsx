import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Composer } from '@/shared/ui/chat/Composer/Composer';
import type { ComposerProps } from '@/shared/ui/chat/Composer/Composer.typedefs';

const baseProps: ComposerProps = {
  value: '',
  onChange: () => undefined,
  onSend: () => undefined,
  onRetry: null,
  placeholder: 'Write a message…',
  label: 'Reply',
  sendLabel: 'Send',
  retryLabel: 'Retry',
};

function Harness({ onSend, initial = '' }: { onSend: () => void; initial?: string }) {
  const [value, setValue] = useState(initial);
  return <Composer {...baseProps} value={value} onChange={setValue} onSend={onSend} />;
}

describe('Composer', () => {
  it('has a labelled field and a send button', () => {
    render(<Composer {...baseProps} />);

    expect(screen.getByRole('textbox', { name: 'Reply' })).toHaveAttribute(
      'placeholder',
      'Write a message…',
    );
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('keeps send disabled while the field is empty or blank', () => {
    const { rerender } = render(<Composer {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    rerender(<Composer {...baseProps} value="   " />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    rerender(<Composer {...baseProps} value="Hello" />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('reports typing', async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<Composer {...baseProps} onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Reply' }), 'a');

    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('sends with Enter', async () => {
    const onSend = vi.fn<() => void>();
    render(<Harness onSend={onSend} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Reply' }), 'Hello{Enter}');

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox', { name: 'Reply' })).toHaveValue('Hello');
  });

  it('adds a line with Shift+Enter instead of sending', async () => {
    const onSend = vi.fn<() => void>();
    render(<Harness onSend={onSend} />);

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Reply' }),
      'One{Shift>}{Enter}{/Shift}Two',
    );

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Reply' })).toHaveValue('One\nTwo');
  });

  it('does not send an empty message with Enter', async () => {
    const onSend = vi.fn<() => void>();
    render(<Harness onSend={onSend} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Reply' }), '{Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends when the button is pressed', async () => {
    const onSend = vi.fn<() => void>();
    render(<Composer {...baseProps} value="Hello" onSend={onSend} />);

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('keeps the text, shows a spinner and ignores sends while sending', async () => {
    const onSend = vi.fn<() => void>();
    render(<Composer {...baseProps} value="Hello" onSend={onSend} sending />);

    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toHaveAttribute('aria-busy', 'true');
    expect(send.querySelector('[data-icon="spinner"]')).not.toBeNull();
    expect(screen.getByRole('textbox', { name: 'Reply' })).toHaveValue('Hello');

    await userEvent.type(screen.getByRole('textbox', { name: 'Reply' }), '{Enter}');
    await userEvent.click(send);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows the delivery failure and retries', async () => {
    const onRetry = vi.fn<() => void>();
    render(
      <Composer {...baseProps} error="Not delivered — Telegram is unreachable" onRetry={onRetry} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Not delivered — Telegram is unreachable');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the failure without a retry button when there is nothing to retry', () => {
    render(<Composer {...baseProps} error="Not delivered" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Not delivered');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('disables the field and the button and explains why', async () => {
    const onSend = vi.fn<() => void>();
    render(
      <Composer
        {...baseProps}
        value="Hello"
        onSend={onSend}
        disabled
        disabledReason="Take over the chat to reply"
      />,
    );

    const field = screen.getByRole('textbox', { name: 'Reply' });
    expect(field).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(field).toHaveAccessibleDescription('Take over the chat to reply');
    expect(onSend).not.toHaveBeenCalled();
  });
});
