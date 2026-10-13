import type { EmailChangeState } from '@/features/auth/constants/emailChange.constants';
import type { EmptyStateTone } from '@/shared/ui/display/EmptyState';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface EmailChangeLook {
  readonly icon: IconName;
  readonly tone: EmptyStateTone;
  readonly retry: boolean;
  readonly backToLogin: boolean;
}

export interface EmailChangeResultProps {
  readonly state: EmailChangeState;
  readonly onRetry: () => void;
}
