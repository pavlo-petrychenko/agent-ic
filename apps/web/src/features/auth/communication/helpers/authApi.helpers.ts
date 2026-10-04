import type { LoginValues } from '@/features/auth/typedefs/authForm.typedefs';
import { getSessionClient } from '@/shared/api/clients/session.client';
import { AuthEndpoint } from '@/shared/api/constants/authApi.constants';
import { postAuthRequest } from '@/shared/api/helpers/authRequest.helpers';
import { sessionTokensSchema } from '@/shared/api/schemas/session.schema';

const startSession = (response: unknown): void => {
  getSessionClient().start(sessionTokensSchema.parse(response));
};

export async function logIn(values: LoginValues): Promise<void> {
  startSession(await postAuthRequest(AuthEndpoint.Login, values));
}
