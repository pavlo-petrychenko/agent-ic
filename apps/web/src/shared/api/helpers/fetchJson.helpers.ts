import {
  ClientErrorCode,
  CONFIG_FETCH_FAILED_MESSAGE,
} from '@/shared/api/constants/clientError.constants';
import { AppError } from '@/shared/api/errors/app.error';

export async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError(CONFIG_FETCH_FAILED_MESSAGE, { code: ClientErrorCode.Network });
  }
  return response.json();
}
