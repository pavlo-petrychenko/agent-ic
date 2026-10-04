import { AuthController } from '@/modules/identity/controllers/auth.controller';
import { EmailTokensRepository } from '@/modules/identity/repositories/email-tokens.repository';
import { SessionsRepository } from '@/modules/identity/repositories/sessions.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { MeResolver } from '@/modules/identity/resolvers/me.resolver';
import { ResendConfirmationResolver } from '@/modules/identity/resolvers/resend-confirmation.resolver';
import { SignUpResolver } from '@/modules/identity/resolvers/sign-up.resolver';
import { EmailConfirmationsService } from '@/modules/identity/services/email-confirmations.service';
import { SessionsService } from '@/modules/identity/services/sessions.service';
import { ConfirmEmailUseCase } from '@/modules/identity/use-cases/confirm-email.use-case';
import { GetMeUseCase } from '@/modules/identity/use-cases/get-me.use-case';
import { LoginUseCase } from '@/modules/identity/use-cases/login.use-case';
import { LogoutUseCase } from '@/modules/identity/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '@/modules/identity/use-cases/refresh-session.use-case';
import { ResendConfirmationUseCase } from '@/modules/identity/use-cases/resend-confirmation.use-case';
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
    SignUpUseCase,
    ConfirmEmailUseCase,
    ResendConfirmationUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    GetMeUseCase,
  ],
  resolvers: [SignUpResolver, ResendConfirmationResolver, MeResolver],
  controllers: [AuthController],
  exports: [UsersRepository, SessionsService, EmailConfirmationsService],
}) {}
