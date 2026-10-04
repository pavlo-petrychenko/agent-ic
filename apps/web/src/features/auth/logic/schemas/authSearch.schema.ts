import { z } from 'zod';
import { LoginNotice } from '@/features/auth/constants/authRoute.constants';

export const loginSearchSchema = z.object({
  redirect: z.string().nullable().catch(null).default(null),
  notice: z.enum(LoginNotice).nullable().catch(null).default(null),
});

export const tokenSearchSchema = z.object({
  token: z.string().min(1).nullable().catch(null).default(null),
});

export const checkEmailSearchSchema = z.object({
  email: z.string().min(1).nullable().catch(null).default(null),
});
