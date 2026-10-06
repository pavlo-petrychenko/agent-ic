import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { NavItem } from '@/shared/ui/navigation/NavItem/NavItem';
import { NavItemLayout } from '@/shared/ui/navigation/NavItem/NavItem.constants';
import { MemoryRouter } from '@test/support/components/MemoryRouter';

describe('NavItem', () => {
  it('links to its destination with an icon and trailing meta', async () => {
    render(
      <MemoryRouter>
        <NavItem to="/auth/sign-up" icon={IconName.Inbox} meta="3">
          Inbox
        </NavItem>
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: /^Inbox/ });
    expect(link).toHaveTextContent('3');
    expect(link).toHaveAttribute('href', '/auth/sign-up');
    expect(link.querySelector('[data-icon="inbox"]')).toBeInTheDocument();
  });

  it('marks the link of the current page as active', async () => {
    render(
      <MemoryRouter>
        <NavItem to="/">Home</NavItem>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Home' })).toHaveAttribute(
      'data-status',
      'active',
    );
  });

  it('keeps its name and shows a tooltip in the rail layout', async () => {
    render(
      <MemoryRouter>
        <NavItem
          to="/auth/sign-up"
          icon={IconName.Inbox}
          layout={NavItemLayout.Rail}
          tooltip="Inbox · 3"
        >
          Inbox
        </NavItem>
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: 'Inbox' });
    await userEvent.tab();

    expect(link).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Inbox · 3');
  });

  it('ignores clicks and leaves the tab order when disabled', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <MemoryRouter>
        <NavItem to="/auth/sign-up" disabled onClick={onClick}>
          Inbox
        </NavItem>
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: 'Inbox' });
    await userEvent.click(link, { pointerEventsCheck: 0 });

    expect(onClick).not.toHaveBeenCalled();
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
  });
});
