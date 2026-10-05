import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { LinkedItem } from '@/shared/ui/runs/LinkedItem/LinkedItem';
import { MemoryRouter } from '@test/support/components/MemoryRouter';

describe('LinkedItem', () => {
  it('is one link named by its sentence', async () => {
    render(
      <MemoryRouter>
        <LinkedItem to="/auth/login">
          Started linked run <strong>create_booking</strong> succeeded
        </LinkedItem>
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', {
      name: 'Started linked run create_booking succeeded',
    });
    expect(link).toHaveAttribute('href', '/auth/login');
    expect(link).not.toHaveAttribute('aria-disabled');
  });

  it('keeps the tile and the chevron decorative', async () => {
    render(
      <MemoryRouter>
        <LinkedItem to="/auth/login">Linked run</LinkedItem>
      </MemoryRouter>,
    );

    await screen.findByRole('link');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('draws the tool event icon on a dark tile by default', async () => {
    const { container } = render(
      <MemoryRouter>
        <LinkedItem to="/auth/login">Linked run</LinkedItem>
      </MemoryRouter>,
    );

    await screen.findByRole('link');
    expect(container.querySelector('[data-icon="tool-event"]')).toBeInTheDocument();
    expect(container.querySelector('[data-icon="chevron-right"]')).toBeInTheDocument();
  });

  it('takes another icon and kind', async () => {
    const { container } = render(
      <MemoryRouter>
        <LinkedItem to="/auth/login" icon={IconName.Api} kind={NodeKind.Api}>
          Linked run
        </LinkedItem>
      </MemoryRouter>,
    );

    await screen.findByRole('link');
    expect(container.querySelector('[data-icon="api"]')).toBeInTheDocument();
  });

  it('ignores clicks and leaves the tab order when disabled', async () => {
    const onClick = vi.fn<() => void>();
    render(
      <MemoryRouter>
        <LinkedItem to="/auth/login" disabled onClick={onClick}>
          Linked run
        </LinkedItem>
      </MemoryRouter>,
    );

    const link = await screen.findByRole('link', { name: 'Linked run' });
    await userEvent.click(link, { pointerEventsCheck: 0 });

    expect(onClick).not.toHaveBeenCalled();
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
  });
});
