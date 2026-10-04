import type { ServerErrorsState } from '@/features/auth/typedefs/authForm.typedefs';

export const NO_SERVER_ERRORS: ServerErrorsState = {
  fieldErrors: {},
  formError: null,
  formReason: null,
};
