import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Callout } from '@/shared/ui/display/Callout/Callout';
import { CalloutTone } from '@/shared/ui/display/Callout/Callout.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

describe('Callout', () => {
  it.each([CalloutTone.Neutral, CalloutTone.Info, CalloutTone.Ok])(
    'announces the %s tone politely',
    (tone) => {
      render(<Callout tone={tone}>Saved</Callout>);

      expect(screen.getByRole('status')).toHaveTextContent('Saved');
    },
  );

  it.each([CalloutTone.Warn, CalloutTone.Err])('announces the %s tone as an alert', (tone) => {
    render(<Callout tone={tone}>Failed</Callout>);

    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('lets the caller override the role, for example inside a node', () => {
    render(
      <Callout tone={CalloutTone.Warn} role="note">
        Window closes
      </Callout>,
    );

    expect(screen.getByRole('note')).toHaveTextContent('Window closes');
  });

  it('shows the default icon of its tone, hidden from assistive technology', () => {
    const { container } = render(<Callout tone={CalloutTone.Ok}>Saved</Callout>);

    expect(container.querySelector('[data-icon="check"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows a custom icon, or none', () => {
    const { container, rerender } = render(<Callout icon={IconName.Key}>Hello</Callout>);
    expect(container.querySelector('[data-icon="key"]')).toBeInTheDocument();

    rerender(<Callout icon={null}>Hello</Callout>);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders the action beside the message', () => {
    render(<Callout action={<button type="button">Retry</button>}>Failed</Callout>);

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
