import { WORKSPACE_NAME_MAX_LENGTH, WorkspaceRole } from '@agent-ic/contracts';
import { z } from 'zod';
import { WorkspaceField } from '@/modules/identity/constants/workspace.constants';
import { isSupportedTimeZone } from '@/modules/identity/helpers/workspace-input.helpers';

const inviteTokenSchema = z.string().min(1);

export const createWorkspaceInputSchema = z.object({
  [WorkspaceField.Name]: z.string().trim().min(1).max(WORKSPACE_NAME_MAX_LENGTH),
  [WorkspaceField.TimeZone]: z.string().refine(isSupportedTimeZone),
});

export const inviteTokenInputSchema = z.object({
  [WorkspaceField.Token]: inviteTokenSchema,
});

export const optionalInviteTokenSchema = inviteTokenSchema.nullish();

export const inviteRoleInputSchema = z.object({
  [WorkspaceField.Role]: z.enum(WorkspaceRole),
});
