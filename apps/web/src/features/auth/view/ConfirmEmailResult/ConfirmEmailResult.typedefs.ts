import type { ConfirmEmailState } from '@/features/auth/constants/confirmation.constants';
import type { ConfirmEmailAction } from '@/features/auth/view/ConfirmEmailResult/ConfirmEmailResult.constants';
import type { EmptyStateTone } from '@/shared/ui/EmptyState';
import type { IconName } from '@/shared/ui/Icon';

export interface ConfirmEmailResultProps {
  state: ConfirmEmailState;
  resending: boolean;
  errorMessage: string | null;
  onResend: () => void;
  onRetry: () => void;
  onSignUp: () => void;
  onLogIn: () => void;
}

export type ConfirmEmailActionLabel =
  `confirm.${Exclude<ConfirmEmailState, ConfirmEmailState.Confirming>}.action`;

export interface ConfirmEmailLookAction {
  readonly kind: ConfirmEmailAction;
  readonly label: ConfirmEmailActionLabel;
}

export interface ConfirmEmailLook {
  readonly icon: IconName;
  readonly tone: EmptyStateTone;
  readonly action: ConfirmEmailLookAction | null;
  readonly backToLogin: boolean;
}
