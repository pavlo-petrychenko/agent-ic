import { SetContextLink } from '@apollo/client/link/context';
import { BEARER_SCHEME, RequestHeader } from '@/shared/api/api.constants';
import { getRequestContext } from '@/shared/api/requestContext';

export const createAuthLink = (): SetContextLink =>
  new SetContextLink((previous) => {
    const { accessToken, workspaceId } = getRequestContext();
    const headers: Record<string, string> = {};
    if (accessToken !== null) {
      headers[RequestHeader.Authorization] = `${BEARER_SCHEME} ${accessToken}`;
    }
    if (workspaceId !== null) {
      headers[RequestHeader.WorkspaceId] = workspaceId;
    }
    return { headers: { ...previous.headers, ...headers } };
  });
