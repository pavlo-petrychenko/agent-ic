import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AttentionCard } from '@/shared/ui/display/AttentionCard/AttentionCard';
import type { AttentionCardRow } from '@/shared/ui/display/AttentionCard/AttentionCard.typedefs';
import { SKELETON_DELAY_MS } from '@/shared/ui/display/Skeleton/Skeleton.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

const ROWS: readonly AttentionCardRow[] = [
  {
    id: 'waiting',
    icon: IconName.Hand,
    title: '2 chats are waiting for a person',
    meta: 'oldest 4 min',
    action: { label: 'Open inbox', href: '/inbox' },
  },
  {
    id: 'token',
    icon: IconName.Alert,
    title: 'Telegram token expires soon',
    meta: null,
    action: null,
  },
];

describe('AttentionCard', () => {
  it('is a region named by its title with one list item per row', () => {
    render(<AttentionCard title="Needs attention" rows={ROWS} />);

    const region = screen.getByRole('region', { name: 'Needs attention' });
    expect(within(region).getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows the meta line and the action link of a row', () => {
    render(<AttentionCard title="Needs attention" rows={ROWS} />);

    expect(screen.getByText('oldest 4 min')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open inbox' })).toHaveAttribute('href', '/inbox');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders nothing when there are no rows', () => {
    const { container } = render(<AttentionCard title="Needs attention" rows={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  describe('while loading', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('keeps the card and shows a skeleton instead of the rows', () => {
      render(<AttentionCard title="Needs attention" rows={ROWS} loading />);

      act(() => {
        vi.advanceTimersByTime(SKELETON_DELAY_MS);
      });

      expect(screen.getByRole('heading', { name: 'Needs attention' })).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });

    it('stays visible while loading with no rows yet', () => {
      render(<AttentionCard title="Needs attention" rows={[]} loading />);

      expect(screen.getByRole('heading', { name: 'Needs attention' })).toBeInTheDocument();
    });
  });
});
