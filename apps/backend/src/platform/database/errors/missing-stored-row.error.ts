import { MISSING_STORED_ROW_MESSAGE } from '@/platform/database/constants/stored-row.constants';

export class MissingStoredRowError extends Error {
  constructor() {
    super(MISSING_STORED_ROW_MESSAGE);
  }
}
