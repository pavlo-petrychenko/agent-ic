import { z } from 'zod';

interface LoginSchemaMessages {
  readonly email: string;
  readonly password: string;
}

export const createLoginSchema = (messages: LoginSchemaMessages) =>
  z.object({
    email: z.email(messages.email),
    password: z.string().min(1, messages.password),
  });
