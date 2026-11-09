import { DEFAULT_LOCALE } from '@agent-ic/contracts';
import type { Locale } from '@agent-ic/contracts';
import type { RequestContextState } from '@/shared/api/typedefs/requestContext.typedefs';

const state: RequestContextState = {
  accessToken: null,
  workspaceId: null,
  locale: DEFAULT_LOCALE,
};

const workspaceListeners = new Set<() => void>();

const changeWorkspaceId = (workspaceId: string | null): void => {
  if (state.workspaceId === workspaceId) {
    return;
  }
  state.workspaceId = workspaceId;
  workspaceListeners.forEach((listener) => listener());
};

export const subscribeToWorkspaceId = (listener: () => void): (() => void) => {
  workspaceListeners.add(listener);
  return () => {
    workspaceListeners.delete(listener);
  };
};

export const getRequestContext = (): Readonly<RequestContextState> => state;

export const setAccessToken = (accessToken: string | null): void => {
  state.accessToken = accessToken;
};

export const setRequestLocale = (locale: Locale): void => {
  state.locale = locale;
};

export const setWorkspaceId = (workspaceId: string | null): void => {
  changeWorkspaceId(workspaceId);
};

export const releaseWorkspaceId = (workspaceId: string): void => {
  if (state.workspaceId === workspaceId) {
    changeWorkspaceId(null);
  }
};
