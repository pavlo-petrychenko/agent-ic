import {
  CONFIRM_EMAIL_STATES,
  ConfirmEmailState,
} from '@/features/auth/constants/confirmation.constants';
import { toAppError } from '@/shared/api/helpers/appError.helpers';

export const toConfirmEmailState = (error: unknown): ConfirmEmailState => {
  const { reason } = toAppError(error);
  return (reason === null ? undefined : CONFIRM_EMAIL_STATES[reason]) ?? ConfirmEmailState.Failed;
};
