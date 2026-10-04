import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from '@/shared/ui/PageHeader/PageHeader';

describe('PageHeader', () => {
  it('shows the page title as the main heading with its subtitle and actions', () => {
    render(
      <PageHeader
        title="Inbox"
        subtitle="Chats that need a person"
        actions={<button type="button">Filter</button>}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByText('Chats that need a person')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
  });
});
