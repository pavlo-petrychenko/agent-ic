import { Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { PASSWORD_RESET_EMAIL_COPY } from '@/modules/notifications/constants/password-reset-email.constants';
import { renderEmail } from '@/modules/notifications/helpers/email-render.helpers';
import {
  passwordResetEmailElement,
  passwordResetEmailSubject,
  passwordResetLink,
} from '@/modules/notifications/helpers/password-reset-email.helpers';

const PUBLIC_URL = 'https://app.agent-ic.test';
const TOKEN = 'abc_DEF-123';
const LINK = `${PUBLIC_URL}/auth/reset-password?token=${TOKEN}`;

describe('password reset email', () => {
  it('links to the web reset page with the token', () => {
    expect(passwordResetLink(PUBLIC_URL, TOKEN)).toBe(LINK);
  });

  it('greets the user by name and carries the link', async () => {
    const email = await renderEmail(
      passwordResetEmailElement({ locale: Locale.En, name: 'Olena', link: LINK }),
    );

    expect(email.html).toContain('Hi Olena,');
    expect(email.html).toContain(`href="${LINK}"`);
    expect(email.html).toContain(PASSWORD_RESET_EMAIL_COPY[Locale.En].expiry);
    expect(email.text).toContain(LINK);
  });

  it('is written in Ukrainian for Ukrainian users', async () => {
    const email = await renderEmail(
      passwordResetEmailElement({ locale: Locale.Uk, name: 'Олена', link: LINK }),
    );

    expect(email.html).toContain('lang="uk"');
    expect(email.html).toContain('Вітаємо, Олена!');
    expect(passwordResetEmailSubject(Locale.Uk)).toBe(PASSWORD_RESET_EMAIL_COPY[Locale.Uk].subject);
  });
});
