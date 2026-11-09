import { describe, expect, it } from 'vitest';
import { notificationListItemText } from '@/features/inbox/logic/helpers/notificationList.helpers';
import type { InboxTranslate } from '@/features/inbox/typedefs/common.typedefs';
import type { NotificationListItem } from '@/features/inbox/typedefs/notificationList.typedefs';

const t = ((key: string, options?: Record<string, unknown>) =>
  options === undefined ? key : `${key}(${JSON.stringify(options)})`) as InboxTranslate;

const item = (overrides: Partial<NotificationListItem>): NotificationListItem => ({
  id: 'notification-1',
  conversationId: 'conversation-1',
  kind: 'escalation',
  waitingMinutes: 4,
  minutesAgo: 0,
  customerName: 'Marta',
  channelKind: 'telegram',
  reason: null,
  createdAt: '2026-11-08T10:00:00.000Z',
  read: false,
  readAt: null,
  ...overrides,
});

describe('notificationListItemText', () => {
  it('uses the customer name and the failure reason for an escalation', () => {
    expect(
      notificationListItemText(item({ reason: 'Customer asks to be called back.' }), t),
    ).toEqual({
      title: 'browser.title({"name":"Marta"})',
      subtitle: 'Customer asks to be called back.',
      meta: 'notifications.kindEscalation · minutesAgo({"count":1})',
    });
  });

  it('falls back to the reminder copy without a customer name', () => {
    expect(
      notificationListItemText(item({ kind: 'reminder', customerName: null, minutesAgo: 1 }), t),
    ).toEqual({
      title: 'browser.reminderTitleFallback({"minutes":4})',
      subtitle: 'browser.reminderBody',
      meta: 'notifications.kindReminder · minutesAgo({"count":1})',
    });
  });
});
