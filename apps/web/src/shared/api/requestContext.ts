import type { RequestContextState } from './api.typedefs';

const state: RequestContextState = {
  accessToken: null,
  workspaceId: null,
};

export const getRequestContext = (): Readonly<RequestContextState> => state;

export const setAccessToken = (accessToken: string | null): void => {
  state.accessToken = accessToken;
};

export const setWorkspaceId = (workspaceId: string | null): void => {
  state.workspaceId = workspaceId;
};
