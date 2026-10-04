import { SetContextLink } from '@apollo/client/link/context';
import { BEARER_SCHEME, RequestHeader } from '@/shared/api/constants/request.constants';
import { getRequestContext } from '@/shared/api/helpers/requestContext.helpers';

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
