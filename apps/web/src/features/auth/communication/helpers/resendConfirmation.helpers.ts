import type { ResendInput, ResendTarget } from '@/features/auth/typedefs/confirmation.typedefs';

export const toResendInput = (target: ResendTarget): ResendInput =>
  'email' in target ? { email: target.email, token: null } : { email: null, token: target.token };
