import { MISSING_HTTP_CTX_MESSAGE } from '@/platform/context/constants/authentication.constants';

export class MissingHttpCtxError extends Error {
  constructor() {
    super(MISSING_HTTP_CTX_MESSAGE);
    this.name = new.target.name;
  }
}
