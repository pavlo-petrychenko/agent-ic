import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SKELETON_DELAY_MS } from '@/shared/ui/display/Skeleton/Skeleton.constants';
import { ConversationRow } from '@/shared/ui/runs/ConversationRow/ConversationRow';
import { ConversationBadgeKind } from '@/shared/ui/runs/ConversationRow/ConversationRow.constants';
import { ConversationRowsSkeleton } from '@/shared/ui/runs/ConversationRow/ConversationRowsSkeleton';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import badgeStyles from '@/shared/ui/display/Badge/Badge.module.scss';
import styles from '@/shared/ui/runs/ConversationRow/ConversationRow.module.scss';

const ROW = {
  to: '/auth/login',
  name: 'Maria Kovalenko',
  initials: 'MK',
  time: '14:02',
  dateTime: '2026-10-05T14:02:00Z',
  preview: 'Can I move my appointment to Friday?',
  channel: 'Telegram',
  agent: 'Receptionist',
};

function renderRow(props: Partial<Parameters<typeof ConversationRow>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ul>
        <li>
          <ConversationRow {...ROW} {...props} />
        </li>
      </ul>
    </MemoryRouter>,
  );
}

describe('ConversationRow', () => {
  it('is one link to the conversation with its name, last message and channel line', async () => {
    renderRow();

    const link = await screen.findByRole('link');
    expect(link).toHaveAttribute('href', '/auth/login');
    expect(link).toHaveTextContent('Maria Kovalenko');
    expect(link).toHaveTextContent('Can I move my appointment to Friday?');
    expect(link).toHaveTextContent('Telegram · Receptionist');
  });

  it('writes the time as a time element', async () => {
    renderRow();

    await screen.findByRole('link');
    const time = screen.getByText('14:02');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('datetime', '2026-10-05T14:02:00Z');
  });

  it('keeps the avatar decorative', async () => {
    renderRow();

    await screen.findByRole('link');
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('MK')).toHaveAttribute('aria-hidden', 'true');
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

  it('says a row is unread in words and makes the preview strong', async () => {
    renderRow({ unread: true, unreadLabel: 'Unread' });

    const link = await screen.findByRole('link');
    expect(link).toHaveTextContent('Unread');
    expect(screen.getByText(ROW.preview)).toHaveClass(cssClass(styles.previewUnread));
  });

  it('adds nothing for a read row', async () => {
    renderRow({ unreadLabel: 'Unread' });

    const link = await screen.findByRole('link');
    expect(link).not.toHaveTextContent('Unread');
    expect(screen.getByText(ROW.preview)).not.toHaveClass(cssClass(styles.previewUnread));
  });

  it('shows the badge text so the state is not carried by colour alone', async () => {
    renderRow({ badge: { kind: ConversationBadgeKind.Waiting, label: 'Waiting' } });

    const link = await screen.findByRole('link');
    expect(link).toHaveTextContent('Waiting');
  });

  it('shows the You badge in the accent tone without a dot', async () => {
    const { container } = renderRow({ badge: { kind: ConversationBadgeKind.You, label: 'You' } });

    await screen.findByRole('link');
    expect(screen.getByText('You')).toHaveClass(cssClass(badgeStyles.accent));
    expect(container.querySelector(`.${cssClass(badgeStyles.dot)}`)).toBeNull();
  });

  it('shows the Waiting badge in the warn tone with a dot', async () => {
    const { container } = renderRow({
      badge: { kind: ConversationBadgeKind.Waiting, label: 'Waiting' },
    });

    await screen.findByRole('link');
    expect(screen.getByText('Waiting')).toHaveClass(cssClass(badgeStyles.warn));
    expect(container.querySelector(`.${cssClass(badgeStyles.dot)}`)).toBeInTheDocument();
  });

  it('shows no badge by default', async () => {
    renderRow();

    const link = await screen.findByRole('link');
    expect(link).not.toHaveTextContent('Waiting');
    expect(link).not.toHaveTextContent('You');
  });
});

describe('ConversationRowsSkeleton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing until the skeleton delay has passed', () => {
    const { container } = render(<ConversationRowsSkeleton label="Loading conversations" />);
    expect(container).toBeEmptyDOMElement();

    act(() => {
      vi.advanceTimersByTime(SKELETON_DELAY_MS);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Loading conversations');
  });

  it('announces one busy status and hides the placeholder rows', () => {
    const { container } = render(<ConversationRowsSkeleton label="Loading conversations" />);
    act(() => {
      vi.advanceTimersByTime(SKELETON_DELAY_MS);
    });

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('output > [aria-hidden="true"]')).toHaveLength(3);
  });

  it('draws the number of rows asked for', () => {
    const { container } = render(<ConversationRowsSkeleton label="Loading" count={5} />);
    act(() => {
      vi.advanceTimersByTime(SKELETON_DELAY_MS);
    });

    expect(container.querySelectorAll('output > [aria-hidden="true"]')).toHaveLength(5);
  });
});
