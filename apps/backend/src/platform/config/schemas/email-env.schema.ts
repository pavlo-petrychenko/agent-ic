import { z } from 'zod';
import {
  EmailMode,
  SMTP_CREDENTIALS_PAIR_MESSAGE,
} from '@/platform/config/constants/email.constants';
import { EnvVar } from '@/platform/config/constants/env.constants';
import {
  optionalTextSchema,
  portSchema,
  textSchema,
} from '@/platform/config/schemas/env-value.schema';
import type { EmailConfig } from '@/platform/config/typedefs/app-config.typedefs';

const smtpEmailSchema = z
  .object({
    [EnvVar.EmailMode]: z.literal(EmailMode.Smtp),
    [EnvVar.EmailFrom]: textSchema,
    [EnvVar.SmtpHost]: textSchema,
    [EnvVar.SmtpPort]: portSchema,
    [EnvVar.SmtpSecure]: z.stringbool(),
    [EnvVar.SmtpRequireTls]: z.stringbool(),
    [EnvVar.SmtpUser]: optionalTextSchema,
    [EnvVar.SmtpPassword]: optionalTextSchema,
  })
  .refine((env) => (env[EnvVar.SmtpUser] === null) === (env[EnvVar.SmtpPassword] === null), {
    message: SMTP_CREDENTIALS_PAIR_MESSAGE,
    path: [EnvVar.SmtpPassword],
  });

const resendEmailSchema = z.object({
  [EnvVar.EmailMode]: z.literal(EmailMode.Resend),
  [EnvVar.EmailFrom]: textSchema,
  [EnvVar.ResendApiKey]: textSchema,
});

export const emailEnvSchema = z
  .discriminatedUnion(EnvVar.EmailMode, [smtpEmailSchema, resendEmailSchema])
  .transform((env): EmailConfig => {
    if (env[EnvVar.EmailMode] === EmailMode.Smtp) {
      const user = env[EnvVar.SmtpUser];
      const password = env[EnvVar.SmtpPassword];
      return {
        mode: EmailMode.Smtp,
        from: env[EnvVar.EmailFrom],
        smtp: {
          host: env[EnvVar.SmtpHost],
          port: env[EnvVar.SmtpPort],
          secure: env[EnvVar.SmtpSecure],
          requireTls: env[EnvVar.SmtpRequireTls],
          credentials: user === null || password === null ? null : { user, password },
        },
      };
    }
    return {
      mode: EmailMode.Resend,
      from: env[EnvVar.EmailFrom],
      resend: { apiKey: env[EnvVar.ResendApiKey] },
    };
  });
