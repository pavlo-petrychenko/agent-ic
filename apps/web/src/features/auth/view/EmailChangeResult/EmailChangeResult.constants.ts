import { EmailChangeState } from '@/features/auth/constants/emailChange.constants';
import type { EmailChangeLook } from '@/features/auth/view/EmailChangeResult/EmailChangeResult.typedefs';
import { EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

export const EMAIL_CHANGE_LOOKS: Readonly<Record<EmailChangeState, EmailChangeLook>> = {
  [EmailChangeState.Confirming]: {
    icon: IconName.Spinner,
    tone: EmptyStateTone.Info,
    retry: false,
    backToLogin: false,
  },
  [EmailChangeState.Changed]: {
    icon: IconName.Check,
    tone: EmptyStateTone.Ok,
    retry: false,
    backToLogin: true,
  },
  [EmailChangeState.Expired]: {
    icon: IconName.Alert,
    tone: EmptyStateTone.Warn,
    retry: false,
    backToLogin: true,
  },
  [EmailChangeState.Invalid]: {
    icon: IconName.Esc,
    tone: EmptyStateTone.Err,
    retry: false,
    backToLogin: true,
  },
  [EmailChangeState.Taken]: {
    icon: IconName.Alert,
    tone: EmptyStateTone.Warn,
    retry: false,
    backToLogin: true,
  },
  [EmailChangeState.Failed]: {
    icon: IconName.Alert,
    tone: EmptyStateTone.Err,
    retry: true,
    backToLogin: true,
  },
};
