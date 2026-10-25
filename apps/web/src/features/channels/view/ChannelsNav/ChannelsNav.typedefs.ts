import type { IconName } from '@/shared/ui/foundations/Icon';

export interface ChannelsNavAction {
  readonly label: string;
  readonly onClick: () => void;
}

export interface ChannelsNavItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: IconName;
  readonly selected: boolean;
  readonly to: string;
  readonly params: Readonly<Record<string, string>>;
}

export interface ChannelsNavGroup {
  readonly id: string;
  readonly label: string;
  readonly action: ChannelsNavAction;
  readonly items: readonly ChannelsNavItem[];
}

export interface ChannelsNavProps {
  readonly title: string;
  readonly ariaLabel: string;
  readonly groups: readonly ChannelsNavGroup[];
  readonly emptyLabel: string | null;
}
