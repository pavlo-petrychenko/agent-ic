import { BATCH_KEY_MISSING_MESSAGE } from '@/platform/graphql-server/constants/graphql-loader.constants';

export class BatchKeyMissingError extends Error {
  constructor(
    readonly useCase: string,
    readonly key: unknown,
  ) {
    super(`${BATCH_KEY_MISSING_MESSAGE} ${useCase} ${String(key)}`);
    this.name = new.target.name;
  }
}
