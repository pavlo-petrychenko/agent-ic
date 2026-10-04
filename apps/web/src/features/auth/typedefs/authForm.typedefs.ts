import type { ErrorReason } from '@agent-ic/contracts';

export interface LoginValues {
  readonly email: string;
  readonly password: string;
}

export interface ForgotPasswordValues {
  readonly email: string;
}

export interface ResetPasswordValues {
  readonly password: string;
  readonly repeatPassword: string;
}

export type ReasonFieldMap = Partial<Record<ErrorReason, string>>;

export interface ServerErrorPlan {
  readonly fields: Readonly<Record<string, string>>;
  readonly formReason: ErrorReason | null;
  readonly showFormError: boolean;
}

export interface ServerErrorsState {
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly formError: string | null;
  readonly formReason: ErrorReason | null;
}

export interface UseServerErrorsResult extends ServerErrorsState {
  readonly report: (error: unknown) => void;
  readonly clearField: (name: string) => void;
}
