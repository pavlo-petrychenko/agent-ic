import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatDivider } from '@/shared/ui/chat/ChatDivider/ChatDivider';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

describe('ChatDivider', () => {
  it('shows its caption as readable text', () => {
    render(<ChatDivider text="Flow paused since 14:03" />);

    expect(screen.getByText('Flow paused since 14:03')).toBeVisible();
  });

  it('is not interactive', () => {
    render(<ChatDivider text="Today" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('draws the icon only when one is given, and hides it from assistive technology', () => {
    const { container, rerender } = render(
      <ChatDivider text="Flow paused since 14:03" icon={IconName.Pause} />,
    );
    expect(container.querySelector('[data-icon="pause"]')).toHaveAttribute('aria-hidden', 'true');

    rerender(<ChatDivider text="Flow paused since 14:03" />);
    expect(container.querySelector('[data-icon]')).toBeNull();
  });

  it('hides the rules from assistive technology', () => {
    const { container } = render(<ChatDivider text="Today" />);

    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });
});
