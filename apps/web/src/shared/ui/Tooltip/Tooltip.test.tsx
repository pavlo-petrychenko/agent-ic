import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip } from '@/shared/ui/Tooltip/Tooltip';
import { TooltipSide } from '@/shared/ui/Tooltip/Tooltip.constants';

describe('Tooltip', () => {
  it('stays closed until the trigger is used', () => {
    render(
      <Tooltip content="Knowledge base">
        <button type="button">Open</button>
      </Tooltip>,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows on keyboard focus and describes the trigger', async () => {
    render(
      <Tooltip content="Knowledge base">
        <button type="button">Open</button>
      </Tooltip>,
    );

    await userEvent.tab();

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Knowledge base');
    expect(screen.getByRole('button', { name: 'Open' })).toHaveAccessibleDescription(
      'Knowledge base',
    );
  });

  it('shows after hovering the trigger', async () => {
    render(
      <Tooltip content="Knowledge base">
        <button type="button">Open</button>
      </Tooltip>,
    );

    await userEvent.hover(screen.getByRole('button', { name: 'Open' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Knowledge base');
  });

  it('closes on Escape', async () => {
    render(
      <Tooltip content="Knowledge base">
        <button type="button">Open</button>
      </Tooltip>,
    );

    await userEvent.tab();
    await screen.findByRole('tooltip');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders rich content and the requested side', async () => {
    render(
      <Tooltip
        side={TooltipSide.Right}
        content={
          <>
            <strong>Tokens</strong> · 12
          </>
        }
      >
        <button type="button">Open</button>
      </Tooltip>,
    );

    await userEvent.tab();

    expect(await screen.findByText('Tokens', { selector: 'strong' })).toBeInTheDocument();
    expect(document.querySelector('[data-side="right"]')).not.toBeNull();
  });
});
