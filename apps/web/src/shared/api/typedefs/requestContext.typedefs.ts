import type { Locale } from '@agent-ic/contracts';

export interface RequestContextState {
  accessToken: string | null;
  workspaceId: string | null;
  locale: Locale;
}
