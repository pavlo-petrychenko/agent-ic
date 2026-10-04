import { INVALID_ID_PREFIX_MESSAGE } from './ids.constants';

export class InvalidIdPrefixError extends Error {
  constructor(readonly prefix: string) {
    super(INVALID_ID_PREFIX_MESSAGE);
  }
}
