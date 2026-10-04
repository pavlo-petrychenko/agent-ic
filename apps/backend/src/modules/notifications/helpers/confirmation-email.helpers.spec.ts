import { Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { CONFIRMATION_EMAIL_COPY } from '@/modules/notifications/constants/confirmation-email.constants';
import {
  confirmationEmailElement,
  confirmationEmailSubject,
  confirmationLink,
} from '@/modules/notifications/helpers/confirmation-email.helpers';
import { renderEmail } from '@/modules/notifications/helpers/email-render.helpers';

const PUBLIC_URL = 'https://app.agent-ic.test';
const TOKEN = 'abc_DEF-123';
const LINK = `${PUBLIC_URL}/auth/confirm-email?token=${TOKEN}`;

describe('confirmation email', () => {
  it('links to the web confirmation page with the token', () => {
    expect(confirmationLink(PUBLIC_URL, TOKEN)).toBe(LINK);
  });

  it('greets the user by name and carries the link', async () => {
    const email = await renderEmail(
      confirmationEmailElement({ locale: Locale.En, name: 'Olena', link: LINK }),
    );

    expect(email.html).toContain('Hi Olena,');
    expect(email.html).toContain(`href="${LINK}"`);
    expect(email.text).toContain(LINK);
  });

  it('is written in Ukrainian for Ukrainian users', async () => {
    const email = await renderEmail(
      confirmationEmailElement({ locale: Locale.Uk, name: 'Олена', link: LINK }),
    );

    expect(email.html).toContain('lang="uk"');
    expect(email.html).toContain('Вітаємо, Олена!');
    expect(confirmationEmailSubject(Locale.Uk)).toBe(CONFIRMATION_EMAIL_COPY[Locale.Uk].subject);
  });
});
