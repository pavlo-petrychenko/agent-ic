import {
  EMAIL_CHANGE_STATES,
  EmailChangeState,
} from '@/features/auth/constants/emailChange.constants';
import { toAppError } from '@/shared/api/helpers/appError.helpers';

export const toEmailChangeState = (error: unknown): EmailChangeState => {
  const { reason } = toAppError(error);
  return (reason === null ? undefined : EMAIL_CHANGE_STATES[reason]) ?? EmailChangeState.Failed;
};
