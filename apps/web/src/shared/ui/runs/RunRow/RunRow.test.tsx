import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SKELETON_DELAY_MS } from '@/shared/ui/display/Skeleton/Skeleton.constants';
import { StatusKind } from '@/shared/ui/display/StatusDot/StatusDot.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { RunRow } from '@/shared/ui/runs/RunRow/RunRow';
import { RUN_STATUS_DOT_KINDS, RunStatus } from '@/shared/ui/runs/RunRow/RunRow.constants';
import { RunRowsSkeleton } from '@/shared/ui/runs/RunRow/RunRowsSkeleton';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import badgeStyles from '@/shared/ui/display/Badge/Badge.module.scss';
import styles from '@/shared/ui/runs/RunRow/RunRow.module.scss';

const ROW = {
  to: '/auth/login',
  title: 'Booking a haircut',
  time: '2 min ago',
  dateTime: '2026-10-05T14:02:00Z',
  status: RunStatus.Ok,
  statusLabel: 'Succeeded',
  detail: ['2.9 s', '$0.007'],
};

function renderRow(props: Partial<Parameters<typeof RunRow>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ul>
        <li>
          <RunRow {...ROW} {...props} />
        </li>
      </ul>
    </MemoryRouter>,
  );
}

describe('RunRow', () => {
  it('is one link to the run with its title and detail line', async () => {
    renderRow();

    const link = await screen.findByRole('link');
    expect(link).toHaveAttribute('href', '/auth/login');
    expect(link).toHaveTextContent('Booking a haircut');
    expect(screen.getByText('2.9 s')).toBeInTheDocument();
    expect(screen.getByText('$0.007')).toBeInTheDocument();
  });

  it('writes the time as a time element', async () => {
    renderRow();

    await screen.findByRole('link');
    const time = screen.getByText('2 min ago');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('datetime', '2026-10-05T14:02:00Z');
  });

  it.each(Object.values(RunStatus))(
    'names the %s status in words and draws its dot',
    async (status) => {
      const { container } = renderRow({ status, statusLabel: `Status ${status}` });

      await screen.findByRole('link');
      expect(screen.getByRole('img', { name: `Status ${status}` })).toBeInTheDocument();
      expect(
        container.querySelector(`[data-kind="${RUN_STATUS_DOT_KINDS[status]}"]`),
      ).not.toBeNull();
    },
  );

  it('maps running, ok, escalated and failed to the run, ok, warn and err dots', () => {
    expect(RUN_STATUS_DOT_KINDS).toEqual({
      [RunStatus.Running]: StatusKind.Run,
      [RunStatus.Ok]: StatusKind.Ok,
      [RunStatus.Escalated]: StatusKind.Warn,
      [RunStatus.Failed]: StatusKind.Err,
    });
  });

  it('shows an error text in the detail line of a failed run', async () => {
    renderRow({ status: RunStatus.Failed, statusLabel: 'Failed', detail: ['API timeout'] });

    await screen.findByRole('link');
    expect(screen.getByText('API timeout')).toBeInTheDocument();
  });

  it('marks the selected row as the current page', async () => {
    renderRow({ selected: true });

    const link = await screen.findByRole('link');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveClass(cssClass(styles.selected));
  });

  it('is not current by default', async () => {
    renderRow();

    expect(await screen.findByRole('link')).not.toHaveAttribute('aria-current');
  });

  it('shows the quality in a pill on the right', async () => {
    renderRow({ quality: '8.4' });

    await screen.findByRole('link');
    expect(screen.getByText('8.4')).toHaveClass(cssClass(styles.quality));
  });

  it('shows no pill without a quality', async () => {
    const { container } = renderRow({ quality: null });

    await screen.findByRole('link');
    expect(container.querySelector(`.${cssClass(badgeStyles.violet)}`)).toBeNull();
  });

  it('uses the trigger icon given on the trigger tile', async () => {
    const { container } = renderRow({ triggerIcon: IconName.Cal });

    await screen.findByRole('link');
    expect(container.querySelector('[data-icon="cal"]')).toBeInTheDocument();
  });

  it('draws the message icon on the trigger tile by default', async () => {
    const { container } = renderRow();

    await screen.findByRole('link');
    expect(container.querySelector('[data-icon="msg"]')).toBeInTheDocument();
  });
});

describe('RunRowsSkeleton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing until the skeleton delay has passed', () => {
    const { container } = render(<RunRowsSkeleton label="Loading runs" />);
    expect(container).toBeEmptyDOMElement();

    act(() => {
      vi.advanceTimersByTime(SKELETON_DELAY_MS);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Loading runs');
  });

  it('announces one busy status and hides the placeholder rows', () => {
    const { container } = render(<RunRowsSkeleton label="Loading runs" />);
    act(() => {
      vi.advanceTimersByTime(SKELETON_DELAY_MS);
    });

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('output > [aria-hidden="true"]')).toHaveLength(3);
  });

  it('draws the number of rows asked for', () => {
    const { container } = render(<RunRowsSkeleton label="Loading" count={4} />);
    act(() => {
      vi.advanceTimersByTime(SKELETON_DELAY_MS);
    });

    expect(container.querySelectorAll('output > [aria-hidden="true"]')).toHaveLength(4);
  });
});
