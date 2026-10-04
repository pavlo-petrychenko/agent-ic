# 0002. Separate `gateway` Deployment for channel ingress

- **Status:** Accepted
- **Date:** 2026-10-02

## Context
Customer messages arrive from Telegram webhooks and the API channel. They must be accepted quickly, de-duplicated and never lost. The API channel's "wait for result" mode keeps requests open for up to 30 s. Dashboard traffic has a different load pattern and a different release risk.

## Decision
Channel ingress runs as its own Deployment, `gateway`, from the same image as the rest of the app. It:
- checks the request;
- de-duplicates (`update_id` / message id);
- saves the message;
- enqueues the run;
- answers in under 100 ms (except "wait for result" requests).

It does no LLM work.

## Consequences
- A spike in customer traffic can't slow down the dashboard, and the reverse.
- `gateway` scales on its own (HPA on CPU / RPS) and can get its own availability target or canary releases.
- It is the first candidate to become a separate service if it ever needs its own release schedule.

## Alternatives considered
- **Serve ingress from `api`:** fewer Deployments, but customer and dashboard traffic would share pods and scaling rules.
