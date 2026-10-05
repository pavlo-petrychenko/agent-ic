import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WIDGET_ACCENT_PROPERTY } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import { WidgetLauncher } from '@/shared/ui/chat/WidgetLauncher/WidgetLauncher';

const ACCENT = '#2f5bd3';

describe('WidgetLauncher', () => {
  it('is a button named by its label', () => {
    render(
      <WidgetLauncher
        accent={ACCENT}
        open={false}
        onToggle={vi.fn<() => void>()}
        label="Open chat"
      />,
    );

    expect(screen.getByRole('button', { name: 'Open chat' })).toBeInTheDocument();
  });

  it('shows the chat icon and reports collapsed while closed', () => {
    render(
      <WidgetLauncher
        accent={ACCENT}
        open={false}
        onToggle={vi.fn<() => void>()}
        label="Open chat"
      />,
    );

    const button = screen.getByRole('button', { name: 'Open chat' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button.querySelector('[data-icon="msg"]')).not.toBeNull();
    expect(button.querySelector('[data-icon="x"]')).toBeNull();
  });

  it('swaps the icon to a cross and reports expanded while open', () => {
    render(
      <WidgetLauncher accent={ACCENT} open onToggle={vi.fn<() => void>()} label="Close chat" />,
    );

    const button = screen.getByRole('button', { name: 'Close chat' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button.querySelector('[data-icon="x"]')).not.toBeNull();
    expect(button.querySelector('[data-icon="msg"]')).toBeNull();
  });

  it('points at the panel it opens', () => {
    render(
      <WidgetLauncher
        accent={ACCENT}
        open={false}
        onToggle={vi.fn<() => void>()}
        label="Open chat"
        controls="widget-panel"
      />,
    );

    expect(screen.getByRole('button', { name: 'Open chat' })).toHaveAttribute(
      'aria-controls',
      'widget-panel',
    );
  });

  it('toggles by click and by keyboard', async () => {
    const onToggle = vi.fn<() => void>();
    render(<WidgetLauncher accent={ACCENT} open={false} onToggle={onToggle} label="Open chat" />);

    await userEvent.click(screen.getByRole('button', { name: 'Open chat' }));
    expect(onToggle).toHaveBeenCalledTimes(1);

    await userEvent.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('takes the customer accent as a custom property', () => {
    render(
      <WidgetLauncher
        accent={ACCENT}
        open={false}
        onToggle={vi.fn<() => void>()}
        label="Open chat"
      />,
    );

    expect(
      screen
        .getByRole('button', { name: 'Open chat' })
        .style.getPropertyValue(WIDGET_ACCENT_PROPERTY),
    ).toBe(ACCENT);
  });
});
