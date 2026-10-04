import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';

import { ClientErrorCode } from '@/shared/api/api.constants';

import { Locale, Namespace } from './i18n.constants';
import { resources } from './i18n.resources';

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

const flatten = (value: unknown, prefix = ''): string[] => {
  if (typeof value === 'string') {
    return [prefix.replace(PLURAL_SUFFIX, '')];
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, prefix.length === 0 ? key : `${prefix}.${key}`),
    );
  }
  return [];
};

const keysOf = (locale: Locale, namespace: Namespace): string[] =>
  [...new Set(flatten(resources[locale][namespace]))].sort();

describe('locale resources', () => {
  it.each(Object.values(Namespace))(
    'has the same keys in English and Ukrainian for %s',
    (namespace) => {
      expect(keysOf(Locale.Uk, namespace)).toEqual(keysOf(Locale.En, namespace));
    },
  );

  it('has a message for every error reason and code, in both languages', () => {
    const expected = [
      ...Object.values(ErrorReason).map((reason) => `reason.${reason}`),
      ...Object.values(ErrorCode).map((code) => `code.${code}`),
      ...Object.values(ClientErrorCode).map((code) => `code.${code}`),
    ];

    for (const locale of Object.values(Locale)) {
      expect(keysOf(locale, Namespace.Errors)).toEqual(expect.arrayContaining(expected));
    }
  });

  it('gives Ukrainian nouns all four plural forms', () => {
    const keys = Object.keys(resources[Locale.Uk][Namespace.Common].status.duration);

    for (const unit of ['day', 'hour', 'minute', 'second']) {
      expect(keys).toEqual(
        expect.arrayContaining([`${unit}_one`, `${unit}_few`, `${unit}_many`, `${unit}_other`]),
      );
    }
  });
});
