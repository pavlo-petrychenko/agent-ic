export interface InboxNotificationCardProps {
  readonly title: string;
  readonly subtitle: string;
  readonly openLabel: string;
  readonly closeLabel: string;
  readonly onOpen: () => void;
  readonly onClose: () => void;
}
