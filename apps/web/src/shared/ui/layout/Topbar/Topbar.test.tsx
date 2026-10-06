import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Topbar } from '@/shared/ui/layout/Topbar/Topbar';

const BREADCRUMBS = {
  ariaLabel: 'Breadcrumb',
  moreLabel: 'More',
  items: [
    { label: 'Agents', to: null },
    { label: 'Support agent', to: null },
  ],
};

describe('Topbar', () => {
  it('is the page header landmark with the trail to the current page', () => {
    render(<Topbar breadcrumbs={BREADCRUMBS} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(trail).toHaveTextContent('Agents');
    expect(screen.getByText('Support agent')).toHaveAttribute('aria-current', 'page');
  });

  it('shows the status pill and the actions beside the trail', () => {
    render(
      <Topbar
        breadcrumbs={BREADCRUMBS}
        status={
          <Badge tone={BadgeTone.Warn} dot>
            Draft · edited from v6
          </Badge>
        }
        actions={
          <>
            <button type="button">Versions</button>
            <button type="button">Publish</button>
          </>
        }
      />,
    );

    expect(screen.getByText('Draft · edited from v6')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Versions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });
});
