import {
  AUTH_API_PATH,
  AUTH_REQUEST_INIT,
  type AuthEndpoint,
  EMPTY_REQUEST_BODY,
} from '@/shared/api/constants/authApi.constants';
import { JSON_CONTENT_TYPE, RequestHeader } from '@/shared/api/constants/request.constants';
import { toAppError, toAppErrorFromProblem } from '@/shared/api/helpers/appError.helpers';

const send = async (endpoint: AuthEndpoint, body: object): Promise<Response> => {
  try {
    return await fetch(`${AUTH_API_PATH}${endpoint}`, {
      ...AUTH_REQUEST_INIT,
      headers: { [RequestHeader.ContentType]: JSON_CONTENT_TYPE },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw toAppError(error);
  }
};

export async function postAuthRequest(
  endpoint: AuthEndpoint,
  body: object = EMPTY_REQUEST_BODY,
): Promise<unknown> {
  const response = await send(endpoint, body);
  const text = await response.text();
  if (!response.ok) {
    throw toAppErrorFromProblem(text, response.statusText);
  }
  if (text.length === 0) {
    return null;
  }
  const parsed: unknown = JSON.parse(text);
  return parsed;
}
