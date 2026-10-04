import { describe, expect, it } from 'vitest';
import { smtpTransportOptions } from '@/modules/notifications/helpers/smtp-transport.helpers';

const MAILPIT = { host: 'mailpit', port: 1025 };
const PROVIDER = { host: 'smtp.example.test', port: 465 };

describe('smtpTransportOptions', () => {
  it('talks plain SMTP without credentials to a local Mailpit', () => {
    const options = smtpTransportOptions({
      ...MAILPIT,
      secure: false,
      requireTls: false,
      credentials: null,
    });

    expect(options).toEqual({ ...MAILPIT, secure: false, requireTLS: false });
  });

  it('uses TLS and signs in to a provider', () => {
    const options = smtpTransportOptions({
      ...PROVIDER,
      secure: true,
      requireTls: true,
      credentials: { user: 'mailer', password: 'mailer-password' },
    });

    expect(options).toEqual({
      ...PROVIDER,
      secure: true,
      requireTLS: true,
      auth: { user: 'mailer', pass: 'mailer-password' },
    });
  });
});
