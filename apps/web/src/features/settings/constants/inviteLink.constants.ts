import { INVITABLE_ROLES, type WorkspaceRole } from '@agent-ic/contracts';

export const INVITE_LINK_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

export const INVITABLE_ROLE_SET: ReadonlyMap<string, WorkspaceRole> = new Map(
  INVITABLE_ROLES.map((role) => [role, role]),
);
