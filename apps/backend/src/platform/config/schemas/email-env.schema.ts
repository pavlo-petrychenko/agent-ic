import { z } from 'zod';
import { EmailMode } from '@/platform/config/constants/email.constants';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { portSchema, textSchema } from '@/platform/config/schemas/env-value.schema';
import type { EmailConfig } from '@/platform/config/typedefs/app-config.typedefs';

const smtpEmailSchema = z.object({
  [EnvVar.EmailMode]: z.literal(EmailMode.Smtp),
  [EnvVar.EmailFrom]: textSchema,
  [EnvVar.SmtpHost]: textSchema,
  [EnvVar.SmtpPort]: portSchema,
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
      return {
        mode: EmailMode.Smtp,
        from: env[EnvVar.EmailFrom],
        smtp: { host: env[EnvVar.SmtpHost], port: env[EnvVar.SmtpPort] },
      };
    }
    return {
      mode: EmailMode.Resend,
      from: env[EnvVar.EmailFrom],
      resend: { apiKey: env[EnvVar.ResendApiKey] },
    };
  });
