import { WORKSPACE_NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, WorkspaceRole } from '@agent-ic/contracts';
import { z } from 'zod';
import { WorkspaceField } from '@/modules/identity/constants/workspace.constants';
import { isSupportedTimeZone } from '@/modules/identity/helpers/workspace-input.helpers';

const tokenSchema = z.string().min(1);
const workspaceNameSchema = z.string().trim().min(1).max(WORKSPACE_NAME_MAX_LENGTH);

export const createWorkspaceInputSchema = z.object({
  [WorkspaceField.Name]: workspaceNameSchema,
  [WorkspaceField.TimeZone]: z.string().refine(isSupportedTimeZone),
});

export const inviteTokenInputSchema = z.object({
  [WorkspaceField.Token]: tokenSchema,
});

export const optionalInviteTokenSchema = tokenSchema.nullish();

export const inviteRoleInputSchema = z.object({
  [WorkspaceField.Role]: z.enum(WorkspaceRole),
});

export const renameWorkspaceInputSchema = z.object({
  [WorkspaceField.Name]: workspaceNameSchema,
});

export const transferOwnershipInputSchema = z.object({
  [WorkspaceField.MembershipId]: tokenSchema,
  [WorkspaceField.Password]: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});
