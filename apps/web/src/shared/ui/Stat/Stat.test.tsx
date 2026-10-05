import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SKELETON_DELAY_MS } from '@/shared/ui/Skeleton/Skeleton.constants';
import { Stat } from '@/shared/ui/Stat/Stat';
import { StatTrendTone } from '@/shared/ui/Stat/Stat.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/Stat/Stat.module.scss';

describe('Stat', () => {
  it('pairs the label with the value', () => {
    render(<Stat label="Conversations" value={1284} sub="last 30 days" />);

    const term = screen.getByText('Conversations');
    expect(term.tagName).toBe('DT');
    expect(screen.getByText('1284').tagName).toBe('DD');
    expect(screen.getByText('last 30 days')).toBeInTheDocument();
  });

  it('accepts a formatted string value', () => {
    render(<Stat label="Resolution" value="94%" />);

    expect(screen.getByText('94%')).toBeInTheDocument();
  });

  it('omits the sub label when it is null', () => {
    const { container } = render(<Stat label="Cost" value="$12" sub={null} />);

    expect(container.querySelector(`.${cssClass(styles.sub)}`)).toBeNull();
  });

  it('shows a trend badge', () => {
    render(<Stat label="Cost" value="$12" trend={{ label: '+8%', tone: StatTrendTone.Err }} />);

    expect(screen.getByText('+8%')).toBeInTheDocument();
  });

  describe('while loading', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('replaces the value with a labelled skeleton', () => {
      render(<Stat label="Conversations" value={1284} loading />);

      act(() => {
        vi.advanceTimersByTime(SKELETON_DELAY_MS);
      });

      expect(screen.queryByText('1284')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Conversations');
    });
  });
});
