import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatStatus } from '@/shared/ui/chat/ChatStatus/ChatStatus';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

describe('ChatStatus', () => {
  it('announces its text as a polite status', () => {
    render(
      <ChatStatus icon={IconName.ToolEvent} text="Tool event run is writing the confirmation…" />,
    );

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Tool event run is writing the confirmation…');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('shows the given icon when done', () => {
    const { container } = render(<ChatStatus icon={IconName.Check} text="Confirmation sent" />);

    expect(container.querySelector('[data-icon="check"]')).not.toBeNull();
    expect(screen.getByRole('status')).not.toHaveAttribute('aria-busy');
  });

  it('swaps the icon for a spinner and reports busy while in progress', () => {
    const { container } = render(
      <ChatStatus icon={IconName.Check} text="Writing the confirmation…" inProgress />,
    );

    expect(container.querySelector('[data-icon="spinner"]')).not.toBeNull();
    expect(container.querySelector('[data-icon="check"]')).toBeNull();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });
});
