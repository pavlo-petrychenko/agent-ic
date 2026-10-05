# 003 Code layout

[Back to the docs](../README.md)

## What it is

Every file has one place. The place comes from what the file is, not from what feature it belongs to.

```
<area>/<kind folder>/<topic>.<kind>.ts
modules/identity/use-cases/create-workspace.use-case.ts
```

`<area>` is a backend module, a platform folder or a web feature. The kind folder says what the file is (`use-cases/`, `repositories/`, `errors/`). The suffix repeats it. `pnpm check:structure` fails on a folder or suffix that is not allowed.

## Why we have it

- You know where a thing is from what it is, and a file name says both.
- Many small files named by topic, never one catch-all file. Reviews stay small.
- An area root holds only the public surface (`<name>.module.ts` and `index.ts`). Everything else is private to the area.
- Tools can check the rules. A path is enough for them to tell a repository from a use case.

## How it works

Backend code has two kinds of area:

| Area                   | Holds                                           | May import                             |
| ---------------------- | ----------------------------------------------- | -------------------------------------- |
| `src/modules/<name>/`  | one business area (`identity`, `notifications`) | `platform/`, other modules' `index.ts` |
| `src/platform/<name>/` | infrastructure used by two or more modules      | other `platform/` folders only         |

`platform/` has no business meaning and no use cases. A platform folder is never named after a kind folder, so it is `database`, not `db`. `src/app/` wires the modules together (page 002).

Each module is one Nest module, written with `defineModule`. The fields decide where code runs:

| Field                                             | Loads in           |
| ------------------------------------------------- | ------------------ |
| `providers`, `exports`, `imports`                 | every role         |
| `resolvers`, `controllers`                        | `api`              |
| `gatewayControllers`                              | `gateway`          |
| `processors`, `listeners`                         | `worker`           |
| `roleProviders`, `roleImports`, `roleControllers` | the roles you list |

A listener's event subscription is registered in every role, so `api` knows where to fan an event out. The listener class itself is created only in a worker.

Another module is used only through its `index.ts`: `import { X } from '@/modules/identity'`. An `index.ts` never exports use cases or resolvers.

On the web, a feature is `features/<name>/` with the same idea. Its layers are `communication/` (talks to the API), `logic/` (behaviour, no fetching), `storage/` (shared state), `view/` (props in, events out) and `containers/` (wire the rest into a screen). Routes in `routes/` pick one container. Other features are used only through their `index.ts`. Page 013 covers this.

The full list of kinds and suffixes, with the reason for each, is [structure.md](../rules/structure.md).

## Add one: a new backend module

Create a module only for a new business area. Workspaces, members and invites belong to `identity`, not to their own module. Ask in review when unsure.

- [ ] Folder `apps/backend/src/modules/<name>/`. Its root holds only `<name>.module.ts` and `index.ts`.
- [ ] `<name>.module.ts` exports `class <Name>Module extends defineModule({...})`. Leave out the keys you do not need. [system.module.ts](../../apps/backend/src/modules/system/system.module.ts) is the smallest one.
- [ ] `index.ts` exports the module class and only what other modules may use: services, repositories, events. Never use cases or resolvers.
- [ ] One line in `DOMAIN_MODULES` in [app-modules.constants.ts](../../apps/backend/src/app/constants/app-modules.constants.ts).
- [ ] Every other file goes into a kind folder from [structure.md](../rules/structure.md). Create a folder only when it has a file.
- [ ] SDL in `graphql/<name>.graphql`, using `extend type Query` and `extend type Mutation`. Then `mise run codegen`. The app refuses to boot when a root field has no resolver.
- [ ] Another module is used only through its `index.ts`.
- [ ] If the module owns tables, follow "Add one: a new table" on page 006.
- [ ] `mise run check` and `mise exec -- pnpm test` pass.

## In the code

- [module-roles.helpers.ts](../../apps/backend/src/platform/module-roles/helpers/module-roles.helpers.ts): `defineModule`, `roleTransports` and `roleModule`.
- [module-roles.typedefs.ts](../../apps/backend/src/platform/module-roles/typedefs/module-roles.typedefs.ts): every field `defineModule` accepts.
- [identity.module.ts](../../apps/backend/src/modules/identity/identity.module.ts): a full module. [notifications.module.ts](../../apps/backend/src/modules/notifications/notifications.module.ts) shows `listeners`.
- Spec: [module-roles.helpers.spec.ts](../../apps/backend/src/platform/module-roles/helpers/module-roles.helpers.spec.ts) shows what each field mounts in each role.

## Pitfalls

- A processor or listener missing from its `defineModule` field is never mounted in the worker, so it never runs.
- A resolver listed under `providers` instead of `resolvers` is mounted in every role, not only `api`.
- Do not import `@/modules/identity/services/...` from another module. Use `@/modules/identity`. The `pnpm depcruise` check fails on it.
- Imports are always absolute (`@/...`), never relative, even inside one folder.

Next: [004 Request lifecycle](004-request-lifecycle.md)
