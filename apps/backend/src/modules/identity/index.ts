export { emailChangeRequestedEvent } from '@/modules/identity/events/email-change-requested.event';
export { emailConfirmationRequestedEvent } from '@/modules/identity/events/email-confirmation-requested.event';
export { passwordResetRequestedEvent } from '@/modules/identity/events/password-reset-requested.event';
export { workspaceDeletedEvent } from '@/modules/identity/events/workspace-deleted.event';
export { IdentityModule } from '@/modules/identity/identity.module';
export { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
export { RolesRepository } from '@/modules/identity/repositories/roles.repository';
export { UsersRepository } from '@/modules/identity/repositories/users.repository';
export { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
export { EmailChangesService } from '@/modules/identity/services/email-changes.service';
export { EmailConfirmationsService } from '@/modules/identity/services/email-confirmations.service';
export { PasswordResetsService } from '@/modules/identity/services/password-resets.service';
export { SampleWorkspaceService } from '@/modules/identity/services/sample-workspace.service';
export { WorkspaceRolesService } from '@/modules/identity/services/workspace-roles.service';
export { SessionsService } from '@/modules/identity/services/sessions.service';
export type {
  IssuedConfirmation,
  IssuedEmailChange,
  IssuedPasswordReset,
} from '@/modules/identity/typedefs/email-token.typedefs';
export type {
  SampleFlowExamplesWorkspace,
  SampleWorkspace,
} from '@/modules/identity/typedefs/sample-workspace.typedefs';
export type {
  DeleteWorkspaceInput,
  WorkspaceDeletedInput,
} from '@/modules/identity/typedefs/workspace.typedefs';
