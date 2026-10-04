import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { SmtpConfig } from '@/platform/config/typedefs/app-config.typedefs';

export const smtpTransportOptions = (smtp: SmtpConfig): SMTPTransport.Options => ({
  host: smtp.host,
  port: smtp.port,
  secure: smtp.secure,
  requireTLS: smtp.requireTls,
  ...(smtp.credentials === null
    ? {}
    : { auth: { user: smtp.credentials.user, pass: smtp.credentials.password } }),
});
