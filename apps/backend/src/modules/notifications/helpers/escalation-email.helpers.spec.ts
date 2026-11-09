import { ChannelKind, Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { renderEmail } from '@/modules/notifications/helpers/email-render.helpers';
import {
  escalationEmailElement,
  escalationEmailSubject,
  reminderEmailElement,
  reminderEmailSubject,
} from '@/modules/notifications/helpers/escalation-email.helpers';

const props = {
  locale: Locale.En,
  customerName: 'Marta S.',
  agentName: 'Salon assistant',
  recipientEmail: 'owner@demo-salon.example',
  channelKind: ChannelKind.Telegram,
  reason: 'Customer asks to be called back.',
  lastMessage: 'Can someone call me back please?',
  time: '14:17',
  workspaceName: 'Demo salon',
  link: 'https://local.agent-ic.pavlop.dev/w/ws_demo/inbox?conversation=cnv_1',
  waitingMinutes: 0,
};

describe('escalation email', () => {
  it('renders the customer, agent, channel, reason, quote, action and footer', async () => {
    const rendered = await renderEmail(escalationEmailElement(props));

    expect(escalationEmailSubject(Locale.En, 'Marta S.')).toBe('Marta S. needs a person');
    expect(rendered.text).toContain('Marta S. needs a person');
    expect(rendered.text).toContain('Salon assistant · to owner@demo-salon.example · 14:17');
    expect(rendered.text).toContain('Salon assistant handed a Telegram chat to your team.');
    expect(rendered.text).toContain('Reason: Customer asks to be called back.');
    expect(rendered.text).toContain('“Can someone call me back please?”');
    expect(rendered.text).toContain('Open in Inbox');
    expect(rendered.text).toContain('email alerts are on for you in Demo salon');
    expect(rendered.html).toContain(props.link);
  });

  it('falls back when the customer name or last message is missing', async () => {
    const rendered = await renderEmail(
      escalationEmailElement({ ...props, customerName: null, lastMessage: null }),
    );

    expect(rendered.text).toContain('A customer needs a person');
    expect(rendered.text).toContain('No customer message is available.');
  });
});

describe('reminder email', () => {
  it('renders the waiting time and a still-unassigned body', async () => {
    const rendered = await renderEmail(reminderEmailElement({ ...props, waitingMinutes: 5 }));

    expect(reminderEmailSubject(Locale.En, 'Marta S.', 5)).toBe('Still waiting: Marta S. — 5 min');
    expect(rendered.text).toContain('Marta S. has been waiting for a person for 5 minutes');
    expect(rendered.text).toContain(
      'The chat was escalated 5 minutes ago and has not been taken yet.',
    );
    expect(rendered.text).toContain('Reason: Customer asks to be called back.');
    expect(rendered.text).toContain('Open in Inbox');
  });

  it('localizes the reminder', async () => {
    const rendered = await renderEmail(
      reminderEmailElement({ ...props, locale: Locale.Uk, waitingMinutes: 5 }),
    );

    expect(reminderEmailSubject(Locale.Uk, 'Marta S.', 5)).toBe('Досі чекає: Marta S. — 5 хв');
    expect(rendered.text).toContain('Marta S. чекає на оператора вже 5 хвилин');
  });
});
