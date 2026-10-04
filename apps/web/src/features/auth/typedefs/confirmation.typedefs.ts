import type { Locale } from '@agent-ic/contracts';
import type { ConfirmEmailState } from '@/features/auth/constants/confirmation.constants';

export interface SignUpValues {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export interface SignUpRequest extends SignUpValues {
  readonly locale: Locale;
  readonly inviteToken: string | null;
}

export type ResendTarget = { readonly email: string } | { readonly token: string };

export interface ResendInput {
  readonly email: string | null;
  readonly token: string | null;
}

export interface UseConfirmEmailResult {
  readonly state: ConfirmEmailState;
  readonly retry: () => Promise<void>;
}
