export interface ChannelsNavAction {
  readonly label: string;
  readonly onClick: () => void;
}

export interface ChannelsNavGroup {
  readonly id: string;
  readonly label: string;
  readonly action: ChannelsNavAction;
}

export interface ChannelsNavProps {
  readonly title: string;
  readonly ariaLabel: string;
  readonly groups: readonly ChannelsNavGroup[];
  readonly emptyLabel: string | null;
}
