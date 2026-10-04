import {
  DARK_COLOR_SCHEME_QUERY,
  MEDIA_QUERY_CHANGE_EVENT,
} from '@/shared/theme/constants/theme.constants';
import type { FakeColorSchemeQuery } from '@test/support/typedefs/colorScheme.typedefs';

export const createFakeColorSchemeQuery = (prefersDark: boolean): FakeColorSchemeQuery => {
  const target = new EventTarget();
  let matches = prefersDark;
  const query = Object.defineProperties(target, {
    media: { value: DARK_COLOR_SCHEME_QUERY },
    onchange: { value: null, writable: true },
    matches: { get: () => matches },
    addListener: { value: () => undefined },
    removeListener: { value: () => undefined },
  }) as MediaQueryList;
  return {
    query,
    setPrefersDark: (next) => {
      matches = next;
      target.dispatchEvent(new Event(MEDIA_QUERY_CHANGE_EVENT));
    },
  };
};
