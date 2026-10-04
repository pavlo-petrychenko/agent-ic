import { AuthController } from '@/modules/identity/controllers/auth.controller';
import { EmailTokensRepository } from '@/modules/identity/repositories/email-tokens.repository';
import { SessionsRepository } from '@/modules/identity/repositories/sessions.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { ForgotPasswordResolver } from '@/modules/identity/resolvers/forgot-password.resolver';
import { MeResolver } from '@/modules/identity/resolvers/me.resolver';
import { ResendConfirmationResolver } from '@/modules/identity/resolvers/resend-confirmation.resolver';
import { SignUpResolver } from '@/modules/identity/resolvers/sign-up.resolver';
import { EmailConfirmationsService } from '@/modules/identity/services/email-confirmations.service';
import { PasswordResetsService } from '@/modules/identity/services/password-resets.service';
import { SessionsService } from '@/modules/identity/services/sessions.service';
import { ConfirmEmailUseCase } from '@/modules/identity/use-cases/confirm-email.use-case';
import { ForgotPasswordUseCase } from '@/modules/identity/use-cases/forgot-password.use-case';
import { GetMeUseCase } from '@/modules/identity/use-cases/get-me.use-case';
import { LoginUseCase } from '@/modules/identity/use-cases/login.use-case';
import { LogoutUseCase } from '@/modules/identity/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '@/modules/identity/use-cases/refresh-session.use-case';
import { ResendConfirmationUseCase } from '@/modules/identity/use-cases/resend-confirmation.use-case';
import { ResetPasswordUseCase } from '@/modules/identity/use-cases/reset-password.use-case';
import { SignUpUseCase } from '@/modules/identity/use-cases/sign-up.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class IdentityModule extends defineModule({
  global: true,
  providers: [
    UsersRepository,
    SessionsRepository,
    EmailTokensRepository,
    SessionsService,
    EmailConfirmationsService,
    PasswordResetsService,
    SignUpUseCase,
    ConfirmEmailUseCase,
    ResendConfirmationUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    GetMeUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
  ],
  resolvers: [SignUpResolver, ResendConfirmationResolver, MeResolver, ForgotPasswordResolver],
  controllers: [AuthController],
  exports: [UsersRepository, SessionsService, EmailConfirmationsService, PasswordResetsService],
}) {}
