import { ErrorReason, INVITE_LINK_TTL_DAYS } from '@agent-ic/contracts';
import { SECONDS_PER_DAY } from '@/modules/identity/constants/identity.constants';

export const INVITE_LINK_TTL_SECONDS = INVITE_LINK_TTL_DAYS * SECONDS_PER_DAY;
export const INVITE_LINK_PATH = '/invite';
export const FIRST_MEMBER_COUNT = 1;
export const MEMBER_COUNTS_ALIAS = 'member_counts';
export const MEMBER_COUNT_COLUMN = 'member_count';

export enum WorkspaceField {
  Name = 'name',
  TimeZone = 'timeZone',
  Role = 'role',
  Token = 'token',
  MembershipId = 'membershipId',
  Password = 'password',
}

export const WORKSPACE_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [WorkspaceField.Name]: ErrorReason.InvalidWorkspaceName,
  [WorkspaceField.TimeZone]: ErrorReason.InvalidTimeZone,
};

export enum WorkspaceGraphqlArgument {
  Token = 'token',
  First = 'first',
  After = 'after',
}

export enum JoinOutcomeKind {
  Joined = 'joined',
  Invalid = 'invalid',
  Expired = 'expired',
}

export enum InviteTokenHmac {
  Algorithm = 'sha256',
  Encoding = 'base64url',
}
