import type { Locale } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { UpdateMyLocaleDocument } from '@/features/workspace/communication/gql/mutation/updateMyLocale.generated';
import { LOCALE_TO_API } from '@/shared/api/constants/locale.constants';

export const buildUpdateMyLocaleMock = (
  locale: Locale,
  onCalled?: (locale: Locale) => void,
): MockLink.MockedResponse => ({
  request: {
    query: UpdateMyLocaleDocument,
    variables: { input: { locale: LOCALE_TO_API[locale] } },
  },
  result: () => {
    onCalled?.(locale);
    return {
      data: {
        updateMyLocale: {
          __typename: 'User',
          id: 'usr_1',
          locale: LOCALE_TO_API[locale],
        },
      },
    };
  },
});
