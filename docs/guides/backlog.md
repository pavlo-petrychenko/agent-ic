# Starter backlog

[Back to the guide](README.md)

This is what is left of team management and personal settings in the MVP scope: UC-3 and UC-14 in [docs/mvp-scope.md](../mvp-scope.md). The list has no order and no owners. Each item names the scope text and the code it builds on.

Before you start an item, read its part of the scope, find the design for its screens, and agree on the GraphQL shape in a short pull request or issue.

## Change a member's role

- **Scope:** UC-14, Team: "change a member's role". Screen `Settings-Team`.
- **Today:** the member list in Settings, Team is read-only (`features/settings/view/MemberList/`). The backend lists members (`members` in `identity/graphql/workspaces.graphql`, `ListMembersUseCase`).
- **Builds on:** `authorize` with `PermissionResource.Team` and `PermissionAction.Edit`; `MembershipsRepository`; `can()` on the web to show the control.
- **Questions to settle:** who may change whose role (an admin and the owner, for example), and what happens to the owner role. See the ownership item below.

## Remove a member

- **Scope:** UC-14, Team: "remove a member". Screen `Settings-Team-Remove`.
- **Today:** not built.
- **Builds on:** the member list; `authorize` on `Team`; `MembershipsRepository`. The web app can use `Dialog` from `shared/ui` for the confirmation.
- **Questions to settle:** what a removed member sees on the next request. The backend already answers `WORKSPACE_ACCESS_DENIED` for a non-member, and the web app shows the "workspace not available" state.

## Transfer ownership

- **Scope:** UC-14, General: "transfer ownership". Screen `Settings-Team-Transfer`.
- **Today:** not built. A workspace has one owner, the person who created it.
- **Builds on:** `MembershipsRepository`, the `workspace_role` enum, `authorize` on `WorkspaceSettings`.
- **Questions to settle:** what role the old owner gets, and whether a password check is needed.

## Profile settings

- **Scope:** UC-14, Profile: name, email change with confirmation, password, interface language, list of workspaces (leave), log out. Screen `Settings-Profile`.
- **Today:** not built. Settings shows only Team. The language switch in the sidebar saves the language in the browser only. `me` returns `id`, `email`, `name` and `locale`.
- **Builds on:** the `users` table and `UsersRepository`; the email token flow of sign-up and password reset (`email_tokens`, `notifications`); the account menu in `features/workspace`.
- **Questions to settle:** which parts are GraphQL and which are REST. Anything that issues or revokes a session is REST under `/api/auth` (architecture.md D92).

## Notification settings

- **Scope:** UC-14, Notifications: per-person toggles for in-platform, email and Telegram; Telegram linking with a one-time code. Screens `Settings-Notifications`, `Settings-Notifications-Link`. UC-3 step 4: an operator links Telegram after joining.
- **Today:** not built. The `notifications` module sends emails only (confirmation and password reset).
- **Builds on:** the `notifications` module; a new table for per-person settings (see the [new table checklist](checklists.md#a-new-table)); jobs for sending (see the [new job checklist](checklists.md#a-new-background-job)).
- **Questions to settle:** where the Telegram alerts bot lives, and which events send a notification (scope §12.11).
