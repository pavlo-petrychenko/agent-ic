export const ID_COLUMN_SUFFIX = '%\\_id';
export const UUID_TYPE = 'uuid';
export const FOREIGN_KEY_CONSTRAINT_TYPE = 'f';
export const WORKSPACES_TABLE = 'identity.workspaces';
export const WORKSPACE_ID_TARGET_COLUMN = 'id';

export const FOREIGN_KEY_EXEMPT_COLUMNS: readonly string[] = [
  'identity.sessions.family_id',
  'identity.workspaces.workspace_id',
  'outbox.messages.workspace_id',
];

export const WORKSPACE_KEY_EXEMPT_TABLES: readonly string[] = [
  'identity.workspaces',
  'outbox.messages',
];
