# 014 Shipping

[Back to the docs](../README.md)

How a change goes from your branch to production, and what you do for a new environment variable.

## What it is

- You open a pull request. CI checks it, the owner reviews it, and it is squash merged.
- A merge to `main` deploys by itself. You do nothing after the merge.
- The deploy setup is split in two repositories. This one holds the code, the Docker files and the Helm chart (`deploy/`). `agent-ic-deploy` holds which version runs in which environment. Developers never change `agent-ic-deploy`.

## Why we have it

- Small, checked pull requests are easy to review, and a bad one is easy to revert.
- The title of a squash-merged pull request becomes the commit on `main`. release-please reads it to build the changelog, so it must be a conventional commit.
- Automatic deploys remove "who deploys today". The cost is that every merge must be safe to run. That is why migrations only add things.

## How it works

```
branch --> pull request --> CI + review --> squash merge to main
                                                  |
   release.yml:  version --> images (build, scan, push) --> chart (package, push)
                                                  |
                      bump the chart version in agent-ic-deploy
                                                  |
        Argo CD syncs: migration job first, then the new pods
```

**Before you open the pull request**

- Branch name: `<type>/<short-description>`, for example `feat/rename-workspace`.
- Commit messages and the pull request title are conventional commits: `feat(settings): rename the workspace`, `fix(identity): ...`, `docs: ...`.
- Keep a pull request under about 600 changed lines, without generated files and the lockfile. Split bigger work into stacked pull requests: the first targets `main`, each next one targets the one before.
- Run both checks. They must pass:

```sh
mise run check
mise exec -- pnpm test
```

- The git hooks (lefthook) format, lint and check the staged files on every commit. If a hook cannot find a tool, commit through mise: `mise exec -- git commit`.
- Fill in the pull request template, [.github/pull_request_template.md](../../.github/pull_request_template.md).

**Screenshots for UI changes.** Show every changed screen or story: EN and UK, light and dark. The images never go into your branch. They go on the `pr-assets` branch:

1. `git worktree add ../agent-ic-assets pr-assets` to check it out in a second worktree.
2. Put the images in a folder named after your work, for example `rename-workspace/general-en-light.png`.
3. Commit and push `pr-assets`.
4. Link each image in the description by its raw URL: `https://github.com/pavlo-petrychenko/agent-ic/blob/pr-assets/rename-workspace/general-en-light.png?raw=true`.

**Review and merge**

- [CODEOWNERS](../../.github/CODEOWNERS) names the three developers for every file, so GitHub asks the two who did not open the pull request for a review.
- CI ([ci.yml](../../.github/workflows/ci.yml)) runs the same checks as `mise run check`, plus the tests, the builds and the chart checks.
- How to review a teammate's pull request: "How to review" in [CONTRIBUTING.md](../../CONTRIBUTING.md).

**How a merge deploys.** [release.yml](../../.github/workflows/release.yml) builds the backend and web images, scans them with Trivy and pushes them. It packages the Helm chart and pushes it to the GitHub registry. Then it updates the chart version in `agent-ic-deploy`. Argo CD sees the new version and rolls it out. The migration runs first, as a job, before the new pods start. The owner can pause the bump before a demo with the `DEPLOY_FREEZE` repository variable.

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
6. Say in the pull request description that a new variable needs a production value. The owner sets production values and secrets in `agent-ic-deploy`. Never put a real secret in this repository.

The web app has no environment variables. Its runtime settings are in `apps/web/public/config.json`.

## In the code

- Pipelines: [ci.yml](../../.github/workflows/ci.yml) and [release.yml](../../.github/workflows/release.yml).
- The Helm chart: [deploy/helm/agent-ic](../../deploy/helm/agent-ic/). The migration job is [migration-job.yaml](../../deploy/helm/agent-ic/templates/migration-job.yaml).
- Config: [platform/config](../../apps/backend/src/platform/config/).
- Rules for branches and pull requests: [docs/rules/git.md](../rules/git.md).

## Pitfalls

- **A drop or a rename in a migration.** The migration runs before the new code, so the old code still runs against it for a moment. Add things first. Remove them in a later, separate pull request, and say in its description that it is the contract step.
- **Editing a merged migration.** Never. Write a new one.
- **A variable added in only one place.** The app fails at startup on the server, not in your tests. Walk the six steps above.
- **A real secret in a file.** `.env.example` and `test-values.yaml` hold examples only.
- **A UI pull request without screenshots.** The checklist asks for them in all four combinations.
- **A non-conventional title.** It becomes the commit on `main`, and the changelog reads it.

Next: [015 Calling the LLM](015-calling-the-llm.md)
