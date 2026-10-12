export interface PublishButtonProps {
  label: string;
  blockedReason: string | null;
  disabled?: boolean;
  onClick: () => void;
}
