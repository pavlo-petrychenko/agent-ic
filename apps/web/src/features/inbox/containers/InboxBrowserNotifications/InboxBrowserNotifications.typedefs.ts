export interface InboxBrowserNotificationsProps {
  readonly enabled: boolean;
  readonly onOpen: (conversationId: string) => void;
}
