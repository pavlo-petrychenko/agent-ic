import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '@/shared/ui/Badge';
import { CardHeader } from '@/shared/ui/CardHeader/CardHeader';
import { CardHeaderLevel } from '@/shared/ui/CardHeader/CardHeader.constants';

describe('CardHeader', () => {
  it('shows the title as a level 3 heading by default', () => {
    render(<CardHeader title="Recent activity" />);

    expect(screen.getByRole('heading', { level: 3, name: 'Recent activity' })).toBeInTheDocument();
  });

  it('uses the requested heading level whatever the size', () => {
    render(
      <CardHeader title="Recent activity" sub="Last 7 days" headingLevel={CardHeaderLevel.H2} />,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Recent activity' })).toBeInTheDocument();
  });

  it('shows the sub line, the tag and the right slot when given', () => {
    render(
      <CardHeader
        title="Web chat"
        sub="Connected 2 days ago"
        tag={<Badge>Live</Badge>}
        right={<button type="button">Manage</button>}
      />,
    );

    expect(screen.getByText('Connected 2 days ago')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument();
  });

  it('leaves out the sub line and the right slot when it is not given them', () => {
    const { container } = render(<CardHeader title="Plain" />);

    expect(container.querySelector('p')).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
