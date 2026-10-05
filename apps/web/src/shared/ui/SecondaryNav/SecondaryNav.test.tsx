import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HeadingElement } from '@/shared/ui/Heading';
import { NodeKind } from '@/shared/ui/NodeTile/NodeTile.constants';
import { SecondaryNav } from '@/shared/ui/SecondaryNav/SecondaryNav';
import type { SecondaryNavGroup } from '@/shared/ui/SecondaryNav/SecondaryNav.typedefs';
import { MemoryRouter } from '@test/support/components/MemoryRouter';

const GROUPS: readonly SecondaryNavGroup[] = [
  {
    id: 'tools',
    label: 'Tools',
    action: null,
    items: [
      {
        id: 'booking',
        to: '/auth/sign-up',
        title: 'create_booking',
        subtitle: 'POST /bookings',
        monoTitle: true,
        tile: { icon: null, tone: NodeKind.Tool },
        selected: true,
      },
    ],
  },
  {
    id: 'api',
    label: 'API connections',
    action: { label: 'New connection', onClick: () => undefined },
    items: [
      {
        id: 'crm',
        to: '/auth/login',
        title: 'CRM',
        subtitle: null,
        monoTitle: false,
        tile: { icon: null, tone: NodeKind.Api },
        selected: false,
      },
    ],
  },
];

describe('SecondaryNav', () => {
  it('lists the objects of each group under a labelled list', async () => {
    render(
      <MemoryRouter>
        <SecondaryNav title="Settings" ariaLabel="Tools" action={null} groups={GROUPS} />
      </MemoryRouter>,
    );

    const toolsList = await screen.findByRole('list', { name: 'Tools' });
    expect(within(toolsList).getByRole('link', { name: /create_booking/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const apiList = screen.getByRole('list', { name: 'API connections' });
    expect(within(apiList).getByRole('link', { name: 'CRM' })).not.toHaveAttribute('aria-current');
  });

  it('renders the title as the main heading by default', async () => {
    render(
      <MemoryRouter>
        <SecondaryNav title="Settings" ariaLabel="Tools" action={null} groups={[]} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  });

  it('renders the title as a level two heading on request', async () => {
    render(
      <MemoryRouter>
        <SecondaryNav
          title="Settings"
          ariaLabel="Tools"
          action={null}
          groups={[]}
          headingAs={HeadingElement.H2}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 2, name: 'Settings' })).toBeInTheDocument();
  });

  it('creates from the header button and from a group button', async () => {
    const onCreate = vi.fn<() => void>();
    const onCreateConnection = vi.fn<() => void>();
    render(
      <MemoryRouter>
        <SecondaryNav
          title="Settings"
          ariaLabel="Tools"
          action={{ label: 'New', onClick: onCreate }}
          groups={[
            {
              id: 'api',
              label: 'API connections',
              action: { label: 'New connection', onClick: onCreateConnection },
              items: [],
            },
          ]}
        />
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByRole('button', { name: 'New' }));
    await userEvent.click(screen.getByRole('button', { name: 'New connection' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreateConnection).toHaveBeenCalledTimes(1);
  });
});
