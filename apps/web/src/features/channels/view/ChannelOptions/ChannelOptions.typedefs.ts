import type { ButtonVariant } from '@/shared/ui/actions/Button';
import type { EmptyStateTone } from '@/shared/ui/display/EmptyState';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface ChannelOption {
  readonly id: string;
  readonly icon: IconName;
  readonly tone: EmptyStateTone;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly actionVariant: ButtonVariant;
  readonly onAction: () => void;
}

export interface ChannelOptionsProps {
  readonly options: readonly ChannelOption[];
}
