import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListGroup } from '@/shared/ui/ListGroup/ListGroup';

describe('ListGroup', () => {
  it('labels the group by its title and offers the add action', async () => {
    const onAdd = vi.fn<() => void>();
    render(
      <ListGroup title="Datasets" addLabel="New dataset" onAdd={onAdd}>
        <a href="/booking">Booking basics</a>
      </ListGroup>,
    );

    expect(screen.getByRole('group', { name: 'Datasets' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Booking basics' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'New dataset' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('has no add button or toggle without handlers', () => {
    render(
      <ListGroup title="Actions">
        <span>Send message</span>
      </ListGroup>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hides its rows and shows the count when collapsed', async () => {
    const onCollapsedChange = vi.fn<(collapsed: boolean) => void>();
    render(
      <ListGroup title="API" count={2} collapsed onCollapsedChange={onCollapsedChange}>
        <a href="/orders">Orders API</a>
      </ListGroup>,
    );

    const toggle = screen.getByRole('button', { name: 'API · 2' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.querySelector('[data-icon="chevron-right"]')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Orders API' })).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(onCollapsedChange).toHaveBeenCalledWith(false);
  });

  it('draws no chevron on an expanded collapsible header', () => {
    render(
      <ListGroup title="API" count={2} onCollapsedChange={() => undefined}>
        <a href="/orders">Orders API</a>
      </ListGroup>,
    );

    const toggle = screen.getByRole('button', { name: 'API' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.querySelector('[data-icon]')).not.toBeInTheDocument();
  });
});
