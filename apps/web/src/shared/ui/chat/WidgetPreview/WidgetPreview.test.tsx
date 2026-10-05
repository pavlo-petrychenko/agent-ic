import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WIDGET_ACCENT_PROPERTY } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import { WidgetPreview } from '@/shared/ui/chat/WidgetPreview/WidgetPreview';
import { WidgetPreviewMessageFrom } from '@/shared/ui/chat/WidgetPreview/WidgetPreview.constants';
import type { WidgetPreviewProps } from '@/shared/ui/chat/WidgetPreview/WidgetPreview.typedefs';

const baseProps: WidgetPreviewProps = {
  stageLabel: 'Live preview',
  name: 'Salon assistant',
  subtitle: 'Usually replies in a minute',
  initials: 'SA',
  accent: '#0f6b6b',
  messages: [
    { from: WidgetPreviewMessageFrom.Bot, text: 'Hi! How can I help?' },
    { from: WidgetPreviewMessageFrom.User, text: 'Can I move my haircut?' },
  ],
  typingLabel: null,
  open: true,
  onToggle: () => undefined,
  openLabel: 'Open chat',
  closeLabel: 'Close chat',
  composerPlaceholder: 'Write a message…',
  composerLabel: 'Message',
  sendLabel: 'Send',
};

describe('WidgetPreview', () => {
  it('labels the stage', () => {
    render(<WidgetPreview {...baseProps} />);

    expect(screen.getByText('Live preview')).toBeInTheDocument();
  });

  it('shows the panel as a dialog named after the assistant', () => {
    render(<WidgetPreview {...baseProps} />);

    const panel = screen.getByRole('dialog', { name: 'Salon assistant' });
    expect(within(panel).getByText('Usually replies in a minute')).toBeInTheDocument();
    expect(within(panel).getByText('SA')).toBeInTheDocument();
  });

  it('leaves out the subtitle when there is none', () => {
    render(<WidgetPreview {...baseProps} subtitle={null} />);

    expect(screen.queryByText('Usually replies in a minute')).not.toBeInTheDocument();
  });

  it('shows the messages in order', () => {
    render(<WidgetPreview {...baseProps} />);

    const panel = screen.getByRole('dialog', { name: 'Salon assistant' });
    expect(within(panel).getByText('Hi! How can I help?')).toBeInTheDocument();
    expect(within(panel).getByText('Can I move my haircut?')).toBeInTheDocument();
  });

  it('shows the typing indicator only when it has a label', () => {
    const { rerender } = render(<WidgetPreview {...baseProps} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    rerender(<WidgetPreview {...baseProps} typingLabel="Salon assistant is typing…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Salon assistant is typing…');
  });

  it('has a composer in the panel', () => {
    render(<WidgetPreview {...baseProps} />);

    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('clears the draft when it is sent', async () => {
    render(<WidgetPreview {...baseProps} />);
    const field = screen.getByRole('textbox', { name: 'Message' });

    await userEvent.type(field, 'Hello{Enter}');

    expect(field).toHaveValue('');
  });

  it('shows only the launcher when closed', () => {
    render(<WidgetPreview {...baseProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open chat' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('ties the launcher to the open panel', () => {
    render(<WidgetPreview {...baseProps} />);

    const launcher = screen.getByRole('button', { name: 'Close chat' });
    const panel = screen.getByRole('dialog', { name: 'Salon assistant' });
    expect(launcher).toHaveAttribute('aria-expanded', 'true');
    expect(launcher).toHaveAttribute('aria-controls', panel.id);
  });

  it('toggles through the launcher', async () => {
    const onToggle = vi.fn<() => void>();
    render(<WidgetPreview {...baseProps} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: 'Close chat' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('sets the customer accent on the stage', () => {
    const { container } = render(<WidgetPreview {...baseProps} accent="#2f5bd3" />);

    expect(
      container.firstElementChild instanceof HTMLElement
        ? container.firstElementChild.style.getPropertyValue(WIDGET_ACCENT_PROPERTY)
        : null,
    ).toBe('#2f5bd3');
  });
});
