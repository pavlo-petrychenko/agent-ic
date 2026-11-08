import { useMutation } from '@apollo/client/react';
import { MarkAllNotificationsReadDocument } from '@/features/inbox/communication/gql/mutation/markAllNotificationsRead.generated';

export type MarkAllNotificationsRead = () => Promise<unknown>;

export function useMarkAllNotificationsRead(): MarkAllNotificationsRead {
  const [mutate] = useMutation(MarkAllNotificationsReadDocument);
  return () => mutate();
}
