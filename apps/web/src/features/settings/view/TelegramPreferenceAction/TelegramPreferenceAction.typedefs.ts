export interface TelegramPreferenceActionProps {
  readonly linked: boolean;
  readonly enabled: boolean;
  readonly waiting: boolean;
  readonly creating: boolean;
  readonly disabled: boolean;
  readonly onStart: () => void;
  readonly onToggle: (enabled: boolean) => void;
}
