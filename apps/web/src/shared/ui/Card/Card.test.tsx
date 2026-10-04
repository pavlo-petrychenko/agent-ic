import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from './Card';

describe('Card', () => {
  it('names its region after the title', () => {
    render(<Card title="Workspace">Body</Card>);

    expect(screen.getByRole('region', { name: 'Workspace' })).toHaveTextContent('Body');
  });

  it('renders content without a title', () => {
    render(<Card>Body</Card>);

    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
