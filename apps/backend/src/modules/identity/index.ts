export { emailConfirmationRequestedEvent } from '@/modules/identity/events/email-confirmation-requested.event';
export { passwordResetRequestedEvent } from '@/modules/identity/events/password-reset-requested.event';
export { IdentityModule } from '@/modules/identity/identity.module';
export { UsersRepository } from '@/modules/identity/repositories/users.repository';
export { EmailConfirmationsService } from '@/modules/identity/services/email-confirmations.service';
export { PasswordResetsService } from '@/modules/identity/services/password-resets.service';
export { SessionsService } from '@/modules/identity/services/sessions.service';
export type {
  IssuedConfirmation,
  IssuedPasswordReset,
} from '@/modules/identity/typedefs/email-token.typedefs';
