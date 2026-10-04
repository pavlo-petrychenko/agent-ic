import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { NavItem } from '@/shared/ui/NavItem/NavItem';
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
});
