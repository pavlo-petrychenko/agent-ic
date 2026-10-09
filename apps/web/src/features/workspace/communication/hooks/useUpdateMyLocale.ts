import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateMyLocaleDocument } from '@/features/workspace/communication/gql/mutation/updateMyLocale.generated';
import { LOCALE_TO_API } from '@/shared/api/constants/locale.constants';
import type { Locale } from '@contracts/index';

export function useUpdateMyLocale(): (locale: Locale) => Promise<void> {
  const [updateMyLocale] = useMutation(UpdateMyLocaleDocument);

  return useCallback(
    async (locale) => {
      await updateMyLocale({
        variables: { input: { locale: LOCALE_TO_API[locale] } },
      });
    },
    [updateMyLocale],
  );
}
