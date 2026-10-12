import { Locale } from '@agent-ic/contracts';
import { toGraphqlMembership } from '@/modules/identity/helpers/workspace-graphql.helpers';
import type {
  ChangeMyPasswordInput,
  ForgotPasswordInput,
  RequestMyEmailChangeInput,
  ResendConfirmationInput,
  UpdateMyLocaleInput,
  UpdateMyNameInput,
} from '@/modules/identity/typedefs/account.typedefs';
import type { Me } from '@/modules/identity/typedefs/user.typedefs';
import type {
  ChangeMyPasswordInput as ChangeMyPasswordArgs,
  ForgotPasswordInput as ForgotPasswordArgs,
  ForgotPasswordPayload,
  RequestMyEmailChangeInput as RequestMyEmailChangeArgs,
  RequestMyEmailChangePayload,
  ResendConfirmationInput as ResendConfirmationArgs,
  ResendConfirmationPayload,
  UpdateMyLocaleInput as UpdateMyLocaleArgs,
  UpdateMyNameInput as UpdateMyNameArgs,
  User,
} from '@/platform/graphql-server/generated/schema.generated';
import { Locale as GraphqlLocale } from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_LOCALE: Readonly<Record<Locale, GraphqlLocale>> = {
  [Locale.En]: GraphqlLocale.En,
  [Locale.Uk]: GraphqlLocale.Uk,
};

const LOCALE_FROM_GRAPHQL: Readonly<Record<GraphqlLocale, Locale>> = {
  [GraphqlLocale.En]: Locale.En,
  [GraphqlLocale.Uk]: Locale.Uk,
};

export const toGraphqlUser = (me: Me): User => ({
  id: me.id,
  email: me.email,
  name: me.name,
  locale: GRAPHQL_LOCALE[me.locale],
  memberships: me.memberships.map(toGraphqlMembership),
  lastWorkspaceId: me.lastWorkspaceId,
});

export const toUpdateMyLocaleInput = (args: UpdateMyLocaleArgs): UpdateMyLocaleInput => ({
  locale: LOCALE_FROM_GRAPHQL[args.locale],
});

export const toResendConfirmationInput = (
  args: ResendConfirmationArgs,
): ResendConfirmationInput => ({ email: args.email ?? null, token: args.token ?? null });

export const acceptedResendPayload = (): ResendConfirmationPayload => ({ accepted: true });

export const toForgotPasswordInput = (args: ForgotPasswordArgs): ForgotPasswordInput => ({
  email: args.email,
});

export const acceptedForgotPasswordPayload = (): ForgotPasswordPayload => ({ accepted: true });

export const toUpdateMyNameInput = (args: UpdateMyNameArgs): UpdateMyNameInput => ({
  name: args.name,
});

export const toRequestMyEmailChangeInput = (
  args: RequestMyEmailChangeArgs,
): RequestMyEmailChangeInput => ({ email: args.email });

export const acceptedRequestMyEmailChangePayload = (): RequestMyEmailChangePayload => ({
  accepted: true,
});

export const toChangeMyPasswordInput = (args: ChangeMyPasswordArgs): ChangeMyPasswordInput => ({
  currentPassword: args.currentPassword,
  newPassword: args.newPassword,
});
