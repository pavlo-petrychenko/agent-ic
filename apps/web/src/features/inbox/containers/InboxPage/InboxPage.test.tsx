import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InboxPage } from '@/features/inbox/containers/InboxPage/InboxPage';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('InboxPage', () => {
  it('shows the three queues', () => {
    renderWithProviders(<InboxPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Needs you · 3' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Live · 2' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Closed · 1' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search conversations')).toBeInTheDocument();
  });

  it('switches to the live queue', async () => {
    renderWithProviders(<InboxPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Live · 2' }));

    expect(screen.getByText('Kateryna D.')).toBeInTheDocument();
    expect(screen.queryByText('Olena K.')).not.toBeInTheDocument();
  });

  it('filters the list by search', async () => {
    renderWithProviders(<InboxPage />);

    await userEvent.type(screen.getByLabelText('Search conversations'), 'Andri');

    expect(screen.getByText('The payment failed twice, what now?')).toBeInTheDocument();
    expect(screen.queryByText('Thanks. Can I come on Friday?')).not.toBeInTheDocument();
  });
});
