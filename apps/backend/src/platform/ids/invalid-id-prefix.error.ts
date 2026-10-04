import { INVALID_ID_PREFIX_MESSAGE } from '@/platform/ids/ids.constants';

export class InvalidIdPrefixError extends Error {
  constructor(readonly prefix: string) {
    super(INVALID_ID_PREFIX_MESSAGE);
  }
}
