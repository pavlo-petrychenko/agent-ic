import { AuthController } from '@/modules/identity/controllers/auth.controller';
import { CleanUpAuthRecordsProcessor } from '@/modules/identity/processors/clean-up-auth-records.processor';
import { EmailTokensRepository } from '@/modules/identity/repositories/email-tokens.repository';
import { InviteLinksRepository } from '@/modules/identity/repositories/invite-links.repository';
import { MembershipDirectoryRepository } from '@/modules/identity/repositories/membership-directory.repository';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { SessionsRepository } from '@/modules/identity/repositories/sessions.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { WorkspaceDirectoryRepository } from '@/modules/identity/repositories/workspace-directory.repository';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { AcceptInviteResolver } from '@/modules/identity/resolvers/accept-invite.resolver';
import { ChangeMyPasswordResolver } from '@/modules/identity/resolvers/change-my-password.resolver';
import { CreateWorkspaceResolver } from '@/modules/identity/resolvers/create-workspace.resolver';
import { DeleteWorkspaceResolver } from '@/modules/identity/resolvers/delete-workspace.resolver';
import { ForgotPasswordResolver } from '@/modules/identity/resolvers/forgot-password.resolver';
import { InviteInfoResolver } from '@/modules/identity/resolvers/invite-info.resolver';
import { InviteLinkResolver } from '@/modules/identity/resolvers/invite-link.resolver';
import { LeaveWorkspaceResolver } from '@/modules/identity/resolvers/leave-workspace.resolver';
import { MeResolver } from '@/modules/identity/resolvers/me.resolver';
import { MembersResolver } from '@/modules/identity/resolvers/members.resolver';
import { MyWorkspacesResolver } from '@/modules/identity/resolvers/my-workspaces.resolver';
import { RememberWorkspaceResolver } from '@/modules/identity/resolvers/remember-workspace.resolver';
import { RemoveMemberResolver } from '@/modules/identity/resolvers/remove-member.resolver';
import { RenameWorkspaceResolver } from '@/modules/identity/resolvers/rename-workspace.resolver';
import { RequestMyEmailChangeResolver } from '@/modules/identity/resolvers/request-my-email-change.resolver';
import { ResendConfirmationResolver } from '@/modules/identity/resolvers/resend-confirmation.resolver';
import { ResetInviteLinkResolver } from '@/modules/identity/resolvers/reset-invite-link.resolver';
import { TransferOwnershipResolver } from '@/modules/identity/resolvers/transfer-ownership.resolver';
import { UpdateInviteLinkRoleResolver } from '@/modules/identity/resolvers/update-invite-link-role.resolver';
import { UpdateMyLocaleResolver } from '@/modules/identity/resolvers/update-my-locale.resolver';
import { UpdateMyNameResolver } from '@/modules/identity/resolvers/update-my-name.resolver';
import { UpdateTimeZoneResolver } from '@/modules/identity/resolvers/update-time-zone.resolver';
import { EmailChangesService } from '@/modules/identity/services/email-changes.service';
import { EmailConfirmationsService } from '@/modules/identity/services/email-confirmations.service';
import { InviteLinksService } from '@/modules/identity/services/invite-links.service';
import { InviteTokensService } from '@/modules/identity/services/invite-tokens.service';
import { MeService } from '@/modules/identity/services/me.service';
import { MembershipWorkspaceAccessService } from '@/modules/identity/services/membership-workspace-access.service';
import { PasswordResetsService } from '@/modules/identity/services/password-resets.service';
import { SampleWorkspaceService } from '@/modules/identity/services/sample-workspace.service';
import { SessionsService } from '@/modules/identity/services/sessions.service';
import { WorkspaceMembershipsService } from '@/modules/identity/services/workspace-memberships.service';
import { AcceptInviteUseCase } from '@/modules/identity/use-cases/accept-invite.use-case';
import { ChangeMyPasswordUseCase } from '@/modules/identity/use-cases/change-my-password.use-case';
import { CleanUpAuthRecordsUseCase } from '@/modules/identity/use-cases/clean-up-auth-records.use-case';
import { ConfirmEmailChangeUseCase } from '@/modules/identity/use-cases/confirm-email-change.use-case';
import { ConfirmEmailUseCase } from '@/modules/identity/use-cases/confirm-email.use-case';
import { CountMembersByRoleUseCase } from '@/modules/identity/use-cases/count-members-by-role.use-case';
import { CreateWorkspaceUseCase } from '@/modules/identity/use-cases/create-workspace.use-case';
import { DeleteWorkspaceUseCase } from '@/modules/identity/use-cases/delete-workspace.use-case';
import { ForgotPasswordUseCase } from '@/modules/identity/use-cases/forgot-password.use-case';
import { GetInviteInfoUseCase } from '@/modules/identity/use-cases/get-invite-info.use-case';
import { GetInviteLinkUseCase } from '@/modules/identity/use-cases/get-invite-link.use-case';
import { GetMeUseCase } from '@/modules/identity/use-cases/get-me.use-case';
import { LeaveWorkspaceUseCase } from '@/modules/identity/use-cases/leave-workspace.use-case';
import { ListMembersUseCase } from '@/modules/identity/use-cases/list-members.use-case';
import { ListMyWorkspacesUseCase } from '@/modules/identity/use-cases/list-my-workspaces.use-case';
import { LoginUseCase } from '@/modules/identity/use-cases/login.use-case';
import { LogoutUseCase } from '@/modules/identity/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '@/modules/identity/use-cases/refresh-session.use-case';
import { RememberWorkspaceUseCase } from '@/modules/identity/use-cases/remember-workspace.use-case';
import { RemoveMemberUseCase } from '@/modules/identity/use-cases/remove-member.use-case';
import { RenameWorkspaceUseCase } from '@/modules/identity/use-cases/rename-workspace.use-case';
import { RequestMyEmailChangeUseCase } from '@/modules/identity/use-cases/request-my-email-change.use-case';
import { ResendConfirmationUseCase } from '@/modules/identity/use-cases/resend-confirmation.use-case';
import { ResetInviteLinkUseCase } from '@/modules/identity/use-cases/reset-invite-link.use-case';
import { ResetPasswordUseCase } from '@/modules/identity/use-cases/reset-password.use-case';
import { SignUpUseCase } from '@/modules/identity/use-cases/sign-up.use-case';
import { TransferOwnershipUseCase } from '@/modules/identity/use-cases/transfer-ownership.use-case';
import { UpdateInviteLinkRoleUseCase } from '@/modules/identity/use-cases/update-invite-link-role.use-case';
import { UpdateMyLocaleUseCase } from '@/modules/identity/use-cases/update-my-locale.use-case';
import { UpdateMyNameUseCase } from '@/modules/identity/use-cases/update-my-name.use-case';
import { UpdateTimeZoneUseCase } from '@/modules/identity/use-cases/update-time-zone.use-case';
import { WorkspaceAccessService } from '@/platform/context/services/workspace-access.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class IdentityModule extends defineModule({
  global: true,
  providers: [
    UsersRepository,
    SessionsRepository,
    EmailTokensRepository,
    WorkspacesRepository,
    MembershipsRepository,
    InviteLinksRepository,
    MembershipDirectoryRepository,
    WorkspaceDirectoryRepository,
    SessionsService,
    EmailConfirmationsService,
    EmailChangesService,
    PasswordResetsService,
    InviteTokensService,
    InviteLinksService,
    WorkspaceMembershipsService,
    MeService,
    SampleWorkspaceService,
    MembershipWorkspaceAccessService,
    { provide: WorkspaceAccessService, useExisting: MembershipWorkspaceAccessService },
    SignUpUseCase,
    ConfirmEmailUseCase,
    ConfirmEmailChangeUseCase,
    ResendConfirmationUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    GetMeUseCase,
    LeaveWorkspaceUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    ChangeMyPasswordUseCase,
    CreateWorkspaceUseCase,
    DeleteWorkspaceUseCase,
    ListMyWorkspacesUseCase,
    GetInviteLinkUseCase,
    UpdateInviteLinkRoleUseCase,
    ResetInviteLinkUseCase,
    GetInviteInfoUseCase,
    AcceptInviteUseCase,
    ListMembersUseCase,
    CountMembersByRoleUseCase,
    CleanUpAuthRecordsUseCase,
    RenameWorkspaceUseCase,
    RememberWorkspaceUseCase,
    RemoveMemberUseCase,
    TransferOwnershipUseCase,
    UpdateMyLocaleUseCase,
    UpdateTimeZoneUseCase,
    UpdateMyNameUseCase,
    RequestMyEmailChangeUseCase,
  ],
  resolvers: [
    ResendConfirmationResolver,
    MeResolver,
    ForgotPasswordResolver,
    ChangeMyPasswordResolver,
    CreateWorkspaceResolver,
    DeleteWorkspaceResolver,
    MyWorkspacesResolver,
    InviteLinkResolver,
    LeaveWorkspaceResolver,
    UpdateInviteLinkRoleResolver,
    ResetInviteLinkResolver,
    InviteInfoResolver,
    AcceptInviteResolver,
    MembersResolver,
    RenameWorkspaceResolver,
    RememberWorkspaceResolver,
    RemoveMemberResolver,
    TransferOwnershipResolver,
    UpdateMyLocaleResolver,
    UpdateTimeZoneResolver,
    UpdateMyNameResolver,
    RequestMyEmailChangeResolver,
  ],
  controllers: [AuthController],
  processors: [CleanUpAuthRecordsProcessor],
  exports: [
    UsersRepository,
    MembershipsRepository,
    WorkspaceDirectoryRepository,
    SessionsService,
    EmailConfirmationsService,
    EmailChangesService,
    PasswordResetsService,
    SampleWorkspaceService,
    WorkspaceAccessService,
  ],
}) {}
