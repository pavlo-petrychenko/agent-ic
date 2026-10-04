import type { CheckEmailNotice } from '@/features/auth/constants/confirmation.constants';

export interface CheckEmailMessageProps {
  email: string | null;
  notice: CheckEmailNotice | null;
  errorMessage: string | null;
  checking: boolean;
  resending: boolean;
  onConfirmed: () => void;
  onResend: () => void;
}
