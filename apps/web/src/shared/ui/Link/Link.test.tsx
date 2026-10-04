import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MemoryRouter } from '@/shared/testing/MemoryRouter';

import { Link } from './Link';

describe('Link', () => {
  it('renders an anchor that points at the route', async () => {
    render(
      <MemoryRouter>
        <Link to="/">Status</Link>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Status' })).toHaveAttribute('href', '/');
  });
});
