import { ChannelKind, Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import {
  escalationTelegramReplyMarkup,
  escalationTelegramText,
  reminderTelegramText,
} from '@/modules/notifications/helpers/escalation-telegram.helpers';

const props = {
  locale: Locale.En,
  customerName: 'Marta S.',
  agentName: 'Salon assistant',
  channelKind: ChannelKind.Telegram,
  reason: 'Customer asks to be called back',
  lastMessage: 'Can someone call me back please?',
  waitingMinutes: 0,
};

describe('reminderTelegramText', () => {
  it('renders the waiting time and an unassigned line', () => {
    expect(reminderTelegramText({ ...props, waitingMinutes: 5 })).toBe(
      [
        '<b>Still waiting · 5 min</b>',
        '',
        '<b>Marta S.</b> · Telegram · Salon assistant',
        '',
        'Escalated 5 minutes ago; still unassigned.',
        '',
        '<i>“Can someone call me back please?”</i>',
        '',
        '<b>Reason:</b> Customer asks to be called back',
      ].join('\n'),
    );
  });

  it('localizes the reminder', () => {
    expect(reminderTelegramText({ ...props, locale: Locale.Uk, waitingMinutes: 5 })).toContain(
      '<b>Досі чекає · 5 хв</b>',
    );
  });
});

describe('escalationTelegramText', () => {
  it('renders the title, customer line, message and reason', () => {
    expect(escalationTelegramText(props)).toBe(
      [
        '<b>Chat needs a person</b>',
        '',
        '<b>Marta S.</b> · Telegram · Salon assistant',
        '',
        '<i>“Can someone call me back please?”</i>',
        '',
        '<b>Reason:</b> Customer asks to be called back',
      ].join('\n'),
    );
  });

  it('uses the fallbacks when the details are missing', () => {
    expect(
      escalationTelegramText({
        ...props,
        customerName: null,
        agentName: null,
        channelKind: null,
        reason: null,
        lastMessage: null,
      }),
    ).toBe(
      [
        '<b>Chat needs a person</b>',
        '',
        '<b>A customer</b> · Chat · The agent',
        '',
        '<i>“No customer message is available.”</i>',
        '',
        '<b>Reason:</b> A chat was escalated to your team.',
      ].join('\n'),
    );
  });

  it('renders the Ukrainian copy', () => {
    const text = escalationTelegramText({ ...props, locale: Locale.Uk });

    expect(text).toContain('Чат потребує людини');
    expect(text).toContain('<b>Причина:</b> Customer asks to be called back');
  });

  it('builds the inbox and take-over buttons', () => {
    expect(
      escalationTelegramReplyMarkup(Locale.En, {
        inboxUrl: 'https://app.test/w/ws_public/inbox?conversation=cnv_public',
        takeOverCallbackData: 'to:ws_public:cnv_public',
      }),
    ).toEqual({
      inline_keyboard: [
        [
          {
            text: 'Open in Inbox',
            url: 'https://app.test/w/ws_public/inbox?conversation=cnv_public',
          },
          { text: 'Take over', callback_data: 'to:ws_public:cnv_public' },
        ],
      ],
    });
  });

  it('omits the take-over button without a conversation', () => {
    expect(
      escalationTelegramReplyMarkup(Locale.En, {
        inboxUrl: 'https://app.test/w/ws_public/inbox',
        takeOverCallbackData: null,
      }),
    ).toEqual({
      inline_keyboard: [[{ text: 'Open in Inbox', url: 'https://app.test/w/ws_public/inbox' }]],
    });
  });

  it('truncates a long customer message', () => {
    const text = escalationTelegramText({ ...props, lastMessage: 'a'.repeat(501) });

    expect(text).toContain(`${'a'.repeat(500)}…`);
  });

  it('escapes HTML in the customer, agent, message and reason', () => {
    const text = escalationTelegramText({
      ...props,
      customerName: '<Marta>',
      agentName: 'Salon & Spa',
      lastMessage: 'Use <b>this</b>',
      reason: 'A & B',
    });

    expect(text).toContain('<b>&lt;Marta&gt;</b> · Telegram · Salon &amp; Spa');
    expect(text).toContain('<i>“Use &lt;b&gt;this&lt;/b&gt;”</i>');
    expect(text).toContain('<b>Reason:</b> A &amp; B');
  });
});
