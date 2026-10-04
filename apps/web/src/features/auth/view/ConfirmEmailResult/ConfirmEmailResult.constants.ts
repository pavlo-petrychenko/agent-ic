import { ConfirmEmailState } from '@/features/auth/constants/confirmation.constants';
import type { ConfirmEmailLook } from '@/features/auth/view/ConfirmEmailResult/ConfirmEmailResult.typedefs';
import { EmptyStateTone } from '@/shared/ui/EmptyState';
import { IconName } from '@/shared/ui/Icon';

export enum ConfirmEmailAction {
  Resend = 'resend',
  Retry = 'retry',
  SignUp = 'signUp',
  LogIn = 'logIn',
}

export const CONFIRM_EMAIL_LOOKS: Readonly<Record<ConfirmEmailState, ConfirmEmailLook>> = {
  [ConfirmEmailState.Confirming]: {
    icon: IconName.Spinner,
    tone: EmptyStateTone.Info,
    action: null,
    backToLogin: false,
  },
  [ConfirmEmailState.Expired]: {
    icon: IconName.Alert,
    tone: EmptyStateTone.Warn,
    action: { kind: ConfirmEmailAction.Resend, label: 'confirm.expired.action' },
    backToLogin: true,
  },
  [ConfirmEmailState.Invalid]: {
    icon: IconName.Esc,
    tone: EmptyStateTone.Err,
    action: { kind: ConfirmEmailAction.SignUp, label: 'confirm.invalid.action' },
    backToLogin: true,
  },
  [ConfirmEmailState.AlreadyConfirmed]: {
    icon: IconName.Check,
    tone: EmptyStateTone.Ok,
    action: { kind: ConfirmEmailAction.LogIn, label: 'confirm.already-confirmed.action' },
    backToLogin: false,
  },
  [ConfirmEmailState.BrowserMismatch]: {
    icon: IconName.Monitor,
    tone: EmptyStateTone.Warn,
    action: { kind: ConfirmEmailAction.SignUp, label: 'confirm.browser-mismatch.action' },
    backToLogin: true,
  },
  [ConfirmEmailState.Failed]: {
    icon: IconName.Alert,
    tone: EmptyStateTone.Err,
    action: { kind: ConfirmEmailAction.Retry, label: 'confirm.failed.action' },
    backToLogin: true,
  },
};
