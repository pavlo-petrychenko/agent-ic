import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { WIDGET_ACCENT_PROPERTY } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import { WidgetComposer } from '@/shared/ui/chat/WidgetComposer/WidgetComposer';
import type { WidgetComposerProps } from '@/shared/ui/chat/WidgetComposer/WidgetComposer.typedefs';

const baseProps: WidgetComposerProps = {
  value: '',
  onChange: () => undefined,
  onSend: () => undefined,
  attach: null,
  placeholder: 'Write a message…',
  messageLabel: 'Message',
  sendLabel: 'Send',
  accent: '#0f6b6b',
};

function Harness({ onSend }: { onSend: () => void }) {
  const [value, setValue] = useState('');
  return <WidgetComposer {...baseProps} value={value} onChange={setValue} onSend={onSend} />;
}

describe('WidgetComposer', () => {
  it('has a labelled field and a send button', () => {
    render(<WidgetComposer {...baseProps} />);

    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute(
      'placeholder',
      'Write a message…',
    );
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('keeps send disabled while the field is empty', () => {
    const { rerender } = render(<WidgetComposer {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    rerender(<WidgetComposer {...baseProps} value="Hi" />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('sends with Enter and adds a line with Shift+Enter', async () => {
    const onSend = vi.fn<() => void>();
    render(<Harness onSend={onSend} />);
    const field = screen.getByRole('textbox', { name: 'Message' });

    await userEvent.type(field, 'One{Shift>}{Enter}{/Shift}Two');
    expect(onSend).not.toHaveBeenCalled();
    expect(field).toHaveValue('One\nTwo');

    await userEvent.type(field, '{Enter}');
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('sends when the button is pressed', async () => {
    const onSend = vi.fn<() => void>();
    render(<WidgetComposer {...baseProps} value="Hi" onSend={onSend} />);

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('shows the attach button only when there is something to attach to', async () => {
    const onAttach = vi.fn<() => void>();
    const { rerender } = render(<WidgetComposer {...baseProps} />);
    expect(screen.queryByRole('button', { name: 'Attach' })).not.toBeInTheDocument();

    rerender(<WidgetComposer {...baseProps} attach={{ label: 'Attach', onAttach }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Attach' }));

    expect(onAttach).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner and ignores sends while sending', async () => {
    const onSend = vi.fn<() => void>();
    render(<WidgetComposer {...baseProps} value="Hi" onSend={onSend} sending />);

    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toHaveAttribute('aria-busy', 'true');
    expect(send.querySelector('[data-icon="spinner"]')).not.toBeNull();

    await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), '{Enter}');
    await userEvent.click(send);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables the field and every button', () => {
    render(
      <WidgetComposer
        {...baseProps}
        value="Hi"
        attach={{ label: 'Attach', onAttach: () => undefined }}
        disabled
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Message' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Attach' })).toBeDisabled();
  });

  it('takes the customer accent as a custom property', () => {
    const { container } = render(<WidgetComposer {...baseProps} accent="#2f5bd3" />);

    expect(
      container.firstElementChild instanceof HTMLElement
        ? container.firstElementChild.style.getPropertyValue(WIDGET_ACCENT_PROPERTY)
        : null,
    ).toBe('#2f5bd3');
  });
});
