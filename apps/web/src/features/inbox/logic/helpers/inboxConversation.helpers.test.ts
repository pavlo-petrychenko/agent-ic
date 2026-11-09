import { describe, expect, it } from 'vitest';
import { InboxProvider, InboxReplyState } from '@/features/inbox/constants/inbox.constants';
import { inboxBanner } from '@/features/inbox/logic/helpers/inboxConversation.helpers';
import type { InboxTranslate } from '@/features/inbox/typedefs/common.typedefs';
import type { InboxConversation } from '@/features/inbox/typedefs/conversation.typedefs';

const t = ((key: string, options?: Record<string, unknown>) => {
  if (key === 'banner.waiting') {
    return `waiting ${String(options?.['duration'])}`;
  }
  if (key === 'banner.duration.hours') {
    return `${String(options?.['hours'])}h`;
  }
  if (key === 'banner.duration.hoursMinutes') {
    return `${String(options?.['hours'])}h ${String(options?.['minutes'])}m`;
  }
  if (key === 'banner.duration.minutes') {
    return `${String(options?.['minutes'])}m`;
  }
  return key;
}) as InboxTranslate;

const waitingConversation = (waitingMinutes: number, minutesAgo: number): InboxConversation => ({
  id: 'cnv_1',
  name: 'Marta S.',
  initials: 'MS',
  provider: InboxProvider.Telegram,
  channelId: null,
  channelName: null,
  agentId: 'agt_1',
  agentName: 'Salon assistant',
  agentVersion: 1,
  replyState: InboxReplyState.Waiting,
  hasBeenHandled: false,
  assigneeName: null,
  preview: '',
  minutesAgo,
  waitingMinutes,
  messages: [],
  guard: null,
  run: null,
  facts: {
    channel: '',
    startedAt: null,
    escalatedAt: null,
    waitingSince: null,
    notified: null,
    runs: null,
    handledBy: null,
    handledSince: null,
    handledUntil: null,
    replyTarget: null,
    closedAt: null,
    agentAnswering: false,
  },
});

describe('inboxBanner', () => {
  it('counts the waiting banner from waiting_since, not the last message', () => {
    expect(inboxBanner(waitingConversation(120, 5), t)).toMatchObject({
      text: 'waiting 2h',
    });
  });
});
