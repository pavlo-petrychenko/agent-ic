import { ClientErrorCode, CONFIG_FETCH_FAILED_MESSAGE } from '@/shared/api/api.constants';
import { AppError } from '@/shared/api/AppError';

export async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError(CONFIG_FETCH_FAILED_MESSAGE, { code: ClientErrorCode.Network });
  }
  return response.json();
}
