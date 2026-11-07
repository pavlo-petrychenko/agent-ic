import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateTelegramNotificationLinkDocument } from '@/features/settings/communication/gql/mutation/createTelegramNotificationLink.generated';
import type { TelegramNotificationLink } from '@/features/settings/typedefs/telegramLink.typedefs';

export interface UseCreateTelegramNotificationLinkResult {
  readonly createLink: () => Promise<TelegramNotificationLink | null>;
  readonly creating: boolean;
}

export function useCreateTelegramNotificationLink(): UseCreateTelegramNotificationLinkResult {
  const [createTelegramNotificationLink, { loading }] = useMutation(
    CreateTelegramNotificationLinkDocument,
  );

  const createLink = useCallback(async () => {
    const { data } = await createTelegramNotificationLink();
    return data?.createTelegramNotificationLink ?? null;
  }, [createTelegramNotificationLink]);

  return { createLink, creating: loading };
}
