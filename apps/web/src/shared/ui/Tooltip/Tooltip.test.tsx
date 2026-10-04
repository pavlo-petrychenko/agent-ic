import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip } from '@/shared/ui/Tooltip/Tooltip';
import { TOOLTIP_MULTILINE_MAX_WIDTH, TooltipSide } from '@/shared/ui/Tooltip/Tooltip.constants';

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
  it('waits for the open delay before showing', async () => {
    render(
      <Tooltip content="Knowledge base">
        <button type="button">Open</button>
      </Tooltip>,
    );

    await userEvent.hover(screen.getByRole('button', { name: 'Open' }));
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
  });

  it('keeps showing briefly after focus leaves, then hides', async () => {
    render(
      <Tooltip content="Knowledge base">
        <button type="button">Open</button>
      </Tooltip>,
    );

    await userEvent.tab();
    await screen.findByRole('tooltip');
    await userEvent.tab();

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('draws an arrow by default and omits it on request', async () => {
    const { unmount } = render(
      <Tooltip content="Knowledge base">
        <button type="button">Open</button>
      </Tooltip>,
    );
    await userEvent.tab();
    await screen.findByRole('tooltip');
    expect(document.querySelector('[data-arrow]')).not.toBeNull();
    unmount();

    render(
      <Tooltip content="Knowledge base" arrow={false}>
        <button type="button">Open</button>
      </Tooltip>,
    );
    await userEvent.tab();
    await screen.findByRole('tooltip');
    expect(document.querySelector('[data-arrow]')).toBeNull();
  });

  it('limits the width of the multi-line form only', async () => {
    const { unmount } = render(
      <Tooltip content="Knowledge base" multiline>
        <button type="button">Open</button>
      </Tooltip>,
    );
    await userEvent.tab();
    await screen.findByRole('tooltip');
    expect(document.querySelector('[data-side]')).toHaveStyle({
      maxWidth: `${TOOLTIP_MULTILINE_MAX_WIDTH}px`,
    });
    unmount();

    render(
      <Tooltip content="Knowledge base">
        <button type="button">Open</button>
      </Tooltip>,
    );
    await userEvent.tab();
    await screen.findByRole('tooltip');
    expect(document.querySelector('[data-side]')).not.toHaveStyle({
      maxWidth: `${TOOLTIP_MULTILINE_MAX_WIDTH}px`,
    });
  });
});
