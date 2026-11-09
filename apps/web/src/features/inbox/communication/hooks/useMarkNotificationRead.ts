import { useMutation } from '@apollo/client/react';
import { MarkNotificationReadDocument } from '@/features/inbox/communication/gql/mutation/markNotificationRead.generated';

export type MarkNotificationRead = (notificationId: string) => Promise<unknown>;

export function useMarkNotificationRead(): MarkNotificationRead {
  const [mutate] = useMutation(MarkNotificationReadDocument);
  return (notificationId: string) => mutate({ variables: { input: { notificationId } } });
}
