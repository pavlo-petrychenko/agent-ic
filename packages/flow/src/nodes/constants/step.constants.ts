import type { AgentExits } from '@flow/document/typedefs/flow.typedefs';

export enum RetrievalMode {
  Tools = 'tools',
  Auto = 'auto',
}

export enum WaitFor {
  All = 'all',
  First = 'first',
}

export enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Patch = 'PATCH',
  Delete = 'DELETE',
}

export enum RequestBodyKind {
  None = 'none',
  Json = 'json',
  Text = 'text',
}

export enum RequestAuthKind {
  None = 'none',
  Bearer = 'bearer',
}

export enum FailureMode {
  Continue = 'continue',
  ErrorPort = 'error_port',
}

export enum MessageContentKind {
  List = 'list',
  Text = 'text',
}

export enum QuickRepliesKind {
  None = 'none',
  Static = 'static',
  Variable = 'variable',
}

export enum EscalationMode {
  Escalate = 'escalate',
  End = 'end',
}

export enum RecipientsKind {
  Operators = 'operators',
  Role = 'role',
  Users = 'users',
}

export enum NotifyChannel {
  InPlatform = 'in_platform',
  Email = 'email',
  Telegram = 'telegram',
}

export enum AgentExitKind {
  End = 'end',
  Handoff = 'handoff',
}

export const AGENT_EXIT_KINDS: readonly AgentExitKind[] = [
  AgentExitKind.End,
  AgentExitKind.Handoff,
];

export const DEFAULT_RETRIEVAL_MODE = RetrievalMode.Tools;

export const NO_AGENT_EXITS: AgentExits = { end: null, handoff: null };
