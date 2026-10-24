import { Locale, PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import {
  EmailTokenPurpose,
  IDENTITY_SCHEMA,
} from '@/modules/identity/constants/identity.constants';
import { moduleSchema } from '@/platform/database/helpers/tenant-table.helpers';

export const identitySchema = moduleSchema(IDENTITY_SCHEMA);

export const localeEnum = identitySchema.enum('locale', [Locale.En, Locale.Uk]);

export const workspaceRoleEnum = identitySchema.enum('workspace_role', [
  WorkspaceRole.Owner,
  WorkspaceRole.Admin,
  WorkspaceRole.Builder,
  WorkspaceRole.Operator,
]);

export const permissionResourceEnum = identitySchema.enum('permission_resource', [
  PermissionResource.Agents,
  PermissionResource.Prompts,
  PermissionResource.KnowledgeBases,
  PermissionResource.Channels,
  PermissionResource.Inbox,
  PermissionResource.Testing,
  PermissionResource.Analytics,
  PermissionResource.Team,
  PermissionResource.WorkspaceSettings,
]);

export const permissionActionEnum = identitySchema.enum('permission_action', [
  PermissionAction.View,
  PermissionAction.Edit,
  PermissionAction.Publish,
  PermissionAction.Delete,
  PermissionAction.Transfer,
  PermissionAction.Leave,
]);

export const emailTokenPurposeEnum = identitySchema.enum('email_token_purpose', [
  EmailTokenPurpose.EmailConfirmation,
  EmailTokenPurpose.PasswordReset,
  EmailTokenPurpose.EmailChange,
]);
