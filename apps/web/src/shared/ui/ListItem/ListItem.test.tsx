import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { ListItem } from '@/shared/ui/ListItem/ListItem';
import { StatusDot } from '@/shared/ui/StatusDot/StatusDot';
import { StatusKind } from '@/shared/ui/StatusDot/StatusDot.constants';
import { MemoryRouter } from '@test/support/components/MemoryRouter';

describe('ListItem', () => {
  it('links to its destination with a tile, title, subtitle and trailing status', async () => {
    render(
      <MemoryRouter>
        <ListItem
          to="/auth/sign-up"
          title="Telegram"
          subtitle="@demo_salon_bot"
          icon={IconName.Channels}
          trailing={<StatusDot kind={StatusKind.Ok} aria-label="Connected" />}
        />
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: /Telegram/ });
    expect(link).toHaveAttribute('href', '/auth/sign-up');
    expect(link).toHaveTextContent('@demo_salon_bot');
    expect(link.querySelector('[data-icon="channels"]')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Connected' })).toBeInTheDocument();
  });

  it('marks the selected row as the current page', async () => {
    render(
      <MemoryRouter>
        <ListItem to="/auth/sign-up" title="Telegram" selected />
        <ListItem to="/auth/login" title="Widget" />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Telegram' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Widget' })).not.toHaveAttribute('aria-current');
  });

  it('does not react to clicks and leaves the tab order when disabled', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <MemoryRouter>
        <ListItem to="/auth/sign-up" title="Telegram" disabled onClick={onClick} />
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: 'Telegram' });
    await userEvent.click(link, { pointerEventsCheck: 0 });

    expect(onClick).not.toHaveBeenCalled();
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
  });
});
