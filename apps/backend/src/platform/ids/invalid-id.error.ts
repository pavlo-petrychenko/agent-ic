import { INVALID_ID_MESSAGE } from './ids.constants';

export class InvalidIdError extends Error {
  constructor(
    readonly expectedPrefix: string,
    readonly value: string,
  ) {
    super(INVALID_ID_MESSAGE);
  }
}
