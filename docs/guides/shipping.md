# From pull request to production

[Back to the docs](../README.md)

## Before you open the pull request

- Branch name: `<type>/<short-description>`, for example `feat/rename-workspace`.
- Commit messages and the pull request title are conventional commits: `feat(settings): rename the workspace`, `fix(identity): …`, `docs: …`.
- Keep a pull request under about 600 changed lines, not counting generated files and the lockfile. Split bigger work into stacked pull requests: the first targets `main`, each next one targets the one before.
- Run the checks. Both must pass:

```sh
mise run check
mise exec -- pnpm test
```

- The git hooks format and lint the staged files on every commit. If a hook cannot find a tool, commit through mise: `mise exec -- git commit`.
- Fill in the pull request template (`.github/pull_request_template.md`).

## Screenshots for UI changes

A pull request that changes the UI shows every changed screen or story: EN and UK, light and dark. The images never go into your branch. They go on the `pr-assets` branch:

1. Check out `pr-assets` in a second worktree: `git worktree add ../agent-ic-assets pr-assets`.
2. Put the images in a folder named after your work, for example `rename-workspace/general-en-light.png`.
3. Commit and push `pr-assets`.
4. Link each image in the pull request description by its raw URL: `https://github.com/pavlo-petrychenko/agent-ic/blob/pr-assets/rename-workspace/general-en-light.png?raw=true`.

## Review and merge

- `.github/CODEOWNERS` names Pavlo as the owner of every file, so GitHub asks him to review. CI runs the same checks as `mise run check`, the tests, the builds and the chart checks.
- How to review a teammate's pull request: "How to review" in [CONTRIBUTING.md](../../CONTRIBUTING.md).
- Pull requests are squash merged. The title becomes the commit on `main`, and release-please builds the changelog from it.

## How a merge deploys

A merge to `main` deploys by itself. You do nothing after the merge.

1. `release.yml` builds the backend and web images, scans them, and pushes them with the Helm chart to the GitHub registry.
2. It then updates the chart version in the deploy repository (`agent-ic-deploy`).
3. Argo CD in the cluster sees the new version and rolls it out. New migrations run first, as a job, before the new pods start.

Developers never change the deploy repository. Pavlo owns it. He can also pause deploys before a demo (`DEPLOY_FREEZE`).

Because migrations run before the new code, a migration must work with the old code too. That is why migrations only add things. A drop or a rename is a later, separate pull request.

## A new environment variable

The backend reads environment variables only in `apps/backend/src/platform/config`. Everywhere else, inject the config.

1. Add the name to the `EnvVar` enum in `platform/config/constants/env.constants.ts`.
2. Add it to the matching zod schema in `platform/config/schemas/` (for example `auth-env.schema.ts`) and to the config type in `platform/config/typedefs/app-config.typedefs.ts`. The app refuses to start when a variable is missing or wrong, and prints which one.
3. Add a local value to `.env.example`. `mise run start` copies new variables into your `.env`.
4. Pass it to the containers: add it to the backend environment block at the top of `compose.yaml`.
5. Add it to the Helm chart in `deploy/helm/agent-ic/`:
   - a plain value: `templates/_helpers.tpl` (`agent-ic.backendEnv`), `values.yaml` and `values.schema.json`;
   - a secret: a key in the matching secret in `values.schema.json` (see `authSecret`).
   - Add an example value to `tools/chart/test-values.yaml`, then run `mise run chart:validate`.
6. Say in the pull request description that a new variable needs a production value. Pavlo sets production values and secrets in the deploy repository. Never put a real secret in this repository.

The web app has no environment variables. Its runtime settings are in `apps/web/public/config.json`.
