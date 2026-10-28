import type { EnqueueOptions } from '@/platform/queues/typedefs/job.typedefs';

export enum IdentityEventName {
  EmailConfirmationRequested = 'identity.email-confirmation-requested',
  PasswordResetRequested = 'identity.password-reset-requested',
  WorkspaceDeleted = 'identity.workspace-deleted',
  EmailChangeRequested = 'identity.email-change-requested',
}

export const WORKSPACE_DELETED_EMIT_OPTIONS: EnqueueOptions = { durable: true };
