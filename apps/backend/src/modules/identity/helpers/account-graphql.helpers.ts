import { Locale } from '@agent-ic/contracts';
import type { ResendConfirmationInput } from '@/modules/identity/typedefs/account.typedefs';
import type { Me } from '@/modules/identity/typedefs/user.typedefs';
import type {
  ResendConfirmationInput as ResendConfirmationArgs,
  ResendConfirmationPayload,
  User,
} from '@/platform/graphql-server/generated/schema.generated';
import { Locale as GraphqlLocale } from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_LOCALE: Readonly<Record<Locale, GraphqlLocale>> = {
  [Locale.En]: GraphqlLocale.En,
  [Locale.Uk]: GraphqlLocale.Uk,
};

export const toGraphqlUser = (me: Me): User => ({
  id: me.id,
  email: me.email,
  name: me.name,
  locale: GRAPHQL_LOCALE[me.locale],
});

export const toResendConfirmationInput = (
  args: ResendConfirmationArgs,
): ResendConfirmationInput => ({ email: args.email ?? null, token: args.token ?? null });

export const acceptedResendPayload = (): ResendConfirmationPayload => ({ accepted: true });
