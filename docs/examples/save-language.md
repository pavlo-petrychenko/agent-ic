# Worked example: save the language to the account

[Back to the docs](../README.md)

This page lists every step to add one small feature: the language a signed-in user picks is saved to their account. It is not built yet, so you can use it as your first task. It touches different files from [rename a workspace](rename-workspace.md), so two people can build both at the same time.

The code below is a sketch that follows the real patterns. Copy the shape, then check names against the files it points to. Read the [identity module tour](identity-module.md) and the [auth and settings tour](auth-and-settings.md) first.

## Why

- The EN/UK switch only changes the browser. `useLocale` (`apps/web/src/shared/i18n/hooks/useLocale.ts`) calls `i18n.changeLanguage` and stores the choice in `localStorage`.
- The account keeps the language chosen at sign-up, in `identity.users.locale`.
- Emails read the account's language. `PasswordResetsService` and `EmailConfirmationsService` return `user.locale`, and the notifications module renders the email in it. A user who switched to Ukrainian still gets the password reset email in English.

After this task, a switch while signed in saves the language to the account, and the app opens in the account's language on any device.

## Before you start

- Branch from `main`: `git switch -c feat/save-language`.
- Start the stack: `mise run start`. See [001 Run and debug](../learn/001-run-and-debug.md).
- Who may change it? Only the signed-in user, for their own account. Users do not belong to a workspace, so there is no permission check and no tenant transaction. Compare this with rename a workspace, which uses `authorize` and `TenantTransactionService`. See [006 Transactions and RLS](../learn/006-transactions-and-rls.md).

## Backend

All files are in `apps/backend/src/modules/identity/`.

### 1. SDL

In `graphql/identity.graphql`, add the field to `type Mutation` and add its input:

```graphql
updateMyLocale(input: UpdateMyLocaleInput!): User!

input UpdateMyLocaleInput {
  locale: Locale!
}
```

It returns `User`, which has an `id`, so the Apollo cache updates `me` on the web without a refetch. `Locale` already exists in this file. Run `mise run codegen`.

### 2. Types and schema

- In `typedefs/account.typedefs.ts`, add:

```ts
export interface UpdateMyLocaleInput {
  readonly locale: Locale;
}
```

- In `schemas/account-input.schema.ts`, add a schema next to `signUpInputSchema`, which validates the locale the same way:

```ts
export const updateMyLocaleInputSchema = z.object({
  [AccountField.Locale]: z.enum(Locale),
});
```

GraphQL already rejects a value that is not `en` or `uk`. The schema keeps the use case safe when another transport calls it.

### 3. Repository

In `repositories/users.repository.ts`, add a method next to `updatePassword`:

```ts
async updateLocale(id: string, locale: Locale, at: Date): Promise<UserRecord | null> {
  const [user] = await this.txHost.tx
    .update(users)
    .set({ locale, updatedAt: at })
    .where(eq(users.id, id))
    .returning();
  return user ?? null;
}
```

### 4. Use case

New file `use-cases/update-my-locale.use-case.ts`:

```ts
@Injectable()
export class UpdateMyLocaleUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly users: UsersRepository,
    private readonly workspaceMemberships: WorkspaceMembershipsService,
    private readonly ids: IdService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx, input: UpdateMyLocaleInput): Promise<Me> {
    const actor = requireUserActor(ctx);
    const { locale } = parseAccountInput(updateMyLocaleInputSchema, input);
    return this.txHost.withTransaction(async () => {
      const user = await this.users.updateLocale(actor.userId, locale, this.clock.now());
      if (user === null) {
        throw new AuthenticationRequiredError();
      }
      return {
        id: this.ids.toPublic(IdPrefix.User, user.id),
        email: user.email,
        name: user.name,
        locale: user.locale,
        memberships: await this.workspaceMemberships.listFor(user.id),
      };
    });
  }
}
```

- `requireUserActor` is the first line. It throws `AuthenticationRequiredError` for an anonymous caller.
- It builds `Me` the same way as `get-me.use-case.ts`. A use case never calls another use case, so do not call `GetMeUseCase` here.

### 5. Resolver

In `helpers/account-graphql.helpers.ts`, add the reverse of `GRAPHQL_LOCALE` and a mapper for the input:

```ts
const LOCALE_FROM_GRAPHQL: Readonly<Record<GraphqlLocale, Locale>> = {
  [GraphqlLocale.En]: Locale.En,
  [GraphqlLocale.Uk]: Locale.Uk,
};

export const toUpdateMyLocaleInput = (args: UpdateMyLocaleArgs): UpdateMyLocaleInput => ({
  locale: LOCALE_FROM_GRAPHQL[args.locale],
});
```

New file `resolvers/update-my-locale.resolver.ts`. Copy `me.resolver.ts`:

```ts
@Resolver()
export class UpdateMyLocaleResolver {
  constructor(private readonly updateMyLocaleUseCase: UpdateMyLocaleUseCase) {}

  @Mutation()
  async updateMyLocale(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: UpdateMyLocaleArgs,
  ): Promise<User> {
    return toGraphqlUser(
      await this.updateMyLocaleUseCase.execute(ctx, toUpdateMyLocaleInput(input)),
    );
  }
}
```

`UpdateMyLocaleArgs` is the generated `UpdateMyLocaleInput`, imported under another name, as `account-graphql.helpers.ts` already does for `ForgotPasswordInput`.

### 6. Module

In `identity.module.ts`, add `UpdateMyLocaleUseCase` to `providers` and `UpdateMyLocaleResolver` to `resolvers`.

### 7. Test (optional)

New file `use-cases/update-my-locale.use-case.spec.ts`. Copy `get-me.use-case.spec.ts` and write two cases:

- "saves the locale to the account": `createConfirmedAccount`, then `execute(userCtx(account.userId), { locale: Locale.Uk })`. Expect `me.locale` to be `Locale.Uk`, and `GetMeUseCase` to return `Locale.Uk` afterwards.
- "refuses an anonymous caller": `execute(anonymousCtx(), { locale: Locale.Uk })` rejects with `AuthenticationRequiredError`.

### 8. Try it

Build the web part below, switch the language while signed in, and watch the `UpdateMyLocale` request in the browser's network tab. Then request a password reset for that account and open the email in Mailpit (see [001 Run and debug](../learn/001-run-and-debug.md)). It arrives in the language you picked.

## Web

All files are in `apps/web/src/`. The signed-in app loads the user in the `workspace` feature (`WorkspaceShell` query), so the new code goes there.

### 9. Map the locale from the API

New file `shared/api/constants/locale.constants.ts`. Copy `workspaceRole.constants.ts`:

```ts
export const LOCALE_FROM_API: Readonly<Record<ApiLocale, Locale>> = {
  [ApiLocale.En]: Locale.En,
  [ApiLocale.Uk]: Locale.Uk,
};

export const LOCALE_TO_API: Readonly<Record<Locale, ApiLocale>> = {
  [Locale.En]: ApiLocale.En,
  [Locale.Uk]: ApiLocale.Uk,
};
```

`ApiLocale` is `Locale` from `@/shared/api/generated/schema.generated`, imported under another name.

### 10. Read the account's locale

- In `features/workspace/communication/gql/query/workspaceShell.graphql`, add `locale` under `me`. Run `mise run codegen`.
- In `features/workspace/typedefs/workspace.typedefs.ts`, add `readonly locale: Locale;` to `ShellUser`.
- In `features/workspace/communication/helpers/workspaceShell.helpers.ts`, map it: `locale: LOCALE_FROM_API[data.me.locale]`.
- In `features/workspace/communication/fixtures/workspaceShell.fixture.ts`, add `locale: Locale.En` (from `@agent-ic/contracts`, as `role` uses `WorkspaceRole`) to the default `user` of `buildWorkspaceShellMock`. Without it, every test that uses the shell mock fails on the missing field.

### 11. Operation and data hook

New file `features/workspace/communication/gql/mutation/updateMyLocale.graphql`:

```graphql
mutation UpdateMyLocale($input: UpdateMyLocaleInput!) {
  updateMyLocale(input: $input) {
    id
    locale
  }
}
```

Run `mise run codegen`. Then `features/workspace/communication/hooks/useUpdateMyLocale.ts`:

```ts
export function useUpdateMyLocale(): (locale: Locale) => Promise<void> {
  const [updateMyLocale] = useMutation(UpdateMyLocaleDocument);

  return useCallback(
    async (locale) => {
      await updateMyLocale({ variables: { input: { locale: LOCALE_TO_API[locale] } } });
    },
    [updateMyLocale],
  );
}
```

The answer has the user `id`, so Apollo updates `me.locale` in the `WorkspaceShell` result. Export the hook from `features/workspace/index.ts`, because the app layout uses it.

### 12. Save on switch

`app/components/LocaleSwitcher/` is shared by the signed-out pages and the signed-in app, so it gets an optional callback instead of the mutation itself.

- In `LocaleSwitcher.typedefs.ts`, add `onLocaleChange?: (locale: Locale) => Promise<void>;`.
- In `LocaleSwitcher.tsx`, change the language first, then call the callback. Show a toast when it fails, as `InviteLinkPanel.tsx` does with `useToast()`, `useErrorMessage()` and `toAppError()`. Never drop the error.

```ts
const change = async (next: Locale) => {
  setLocale(next);
  if (onLocaleChange === undefined) {
    return;
  }
  try {
    await onLocaleChange(next);
  } catch (error) {
    showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
  }
};
```

`SegmentedControl` expects `onValueChange` to return nothing, so pass `(next) => void change(next)`. `change` handles its own errors, so nothing is lost.

- In `app/layouts/WorkspaceLayout/WorkspaceLayout.tsx`, take `useUpdateMyLocale()` from `@/features/workspace` and pass it: `<LocaleSwitcher compact onLocaleChange={saveLocale} />`. `AuthLayout` and `AppHeader` stay as they are, because nobody is signed in there.

### 13. Open in the account's language

New file `features/workspace/logic/hooks/useApplyAccountLocale.ts`. It switches the app to the account's language once, when that language is first loaded or changes on the server:

```ts
export function useApplyAccountLocale(accountLocale: Locale | null): void {
  const { locale, setLocale } = useLocale();
  const applied = useRef<Locale | null>(null);

  useEffect(() => {
    if (accountLocale === null || applied.current === accountLocale) {
      return;
    }
    applied.current = accountLocale;
    if (accountLocale !== locale) {
      setLocale(accountLocale);
    }
  }, [accountLocale, locale, setLocale]);
}
```

- The `applied` ref matters. Without it, a switch to Ukrainian would flip straight back to English before the mutation returns, because the account still says English for a moment.
- Call it in `features/workspace/containers/WorkspaceNavigation/WorkspaceNavigation.tsx`, which already reads the shell: `useApplyAccountLocale(data?.user.locale ?? null)`.
- No translation keys are needed. The error toast uses the shared error messages.

### 14. Test (optional)

Copy `apps/web/test/integration/workspaceShell.test.tsx` and write two cases:

- "opens in the account's language": pass `locale: Locale.Uk` to `buildWorkspaceShellMock`, render the workspace, and expect Ukrainian navigation labels.
- "saves the language on switch": add a mock for `UpdateMyLocaleDocument` (put `buildUpdateMyLocaleMock` in a fixture in `features/workspace/communication/fixtures/`), click the UK switch, and expect the mock to be called.

## Finish

1. `mise run check` and `mise exec -- pnpm test` pass.
2. Sign in, switch to Ukrainian, sign out, clear the site's local storage and sign in again: the app opens in Ukrainian. Request a password reset and check the email language.
3. Take screenshots of the sidebar switch in EN and UK, light and dark, for the pull request. See [014 Shipping](../learn/014-shipping.md).
4. The change is about 250 lines, so one pull request is fine. Title: `feat(identity): save the language to the account`.
