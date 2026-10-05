# 0004. App repo + deploy repo; Helm chart published as OCI

- **Status:** Accepted; amended 2026-10-04: no Terraform until the AWS move (Cloudflare set up by hand), plus a `bootstrap/` Ansible folder (architecture.md D68, D69); cert-manager dropped on the homeserver (D74)
- **Date:** 2026-10-02

## Context
We deploy with Argo CD (GitOps) to k3s now and to EKS later. Infra has three layers that change at different rates and need different access:
1. how the app is packaged (Dockerfiles, chart templates);
2. what runs where (per-environment values, versions);
3. the platform underneath (cluster add-ons, Terraform).

## Decision
- **`agent-ic` (app repo):** code, Dockerfiles, and the Helm chart templates with safe defaults in `deploy/helm/agent-ic`. On release, CI publishes the image and the chart (as an OCI artifact on GHCR) with **the same version**.
- **`agent-ic-deploy` (deploy repo):**
  - `envs/<env>/` pins the chart and image version and holds the values;
  - `argocd/` holds the Applications;
  - `platform/` holds the add-ons (KEDA, cert-manager, Traefik, monitoring, Langfuse, CloudNativePG);
  - `terraform/` holds Cloudflare now and AWS later.
- **Rule:** what changes with the code lives in the app repo; what changes with the environment lives in the deploy repo.

## Consequences
- A code change that needs a manifest change (new env var, new worker, new queue) is one PR. Chart version N always matches app version N.
- No CI loop from tag-bump commits. The deploy repo is a clean audit log of deploys, and rollback is a `git revert` there.
- Merging app code doesn't grant the ability to change production, and cloud credentials stay out of app CI.
- CI needs a release job that publishes the chart and opens or pushes the version bump in the deploy repo.

## Alternatives considered
- **Everything in one repo:** simplest to navigate, but needs path filters and `[skip ci]` to avoid loops, mixes deploy commits into code history, and gives code-merge rights over production.
- **Chart in the deploy repo:** keeps all Kubernetes objects together, but code changes that need manifest changes become two coordinated PRs with an ordering trap. It only fits a platform team or a shared "golden chart".
- **Argo CD multi-source (chart read from the app repo at a git tag):** no publish step, but couples the deploy repo to the app repo's paths and tags.
- **Three repos (code / GitOps / Terraform):** the best isolation, but overkill for 3 people.
