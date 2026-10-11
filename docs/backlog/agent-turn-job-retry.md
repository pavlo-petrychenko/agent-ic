# Agent turn progress across a job retry

## Now
- `runAgent` keeps the turn's transcript in memory. The fallback model and a retry of the Agent step continue from it, so a finished tool never runs again inside one job attempt (D263).
- When the job itself is retried (for example `LlmUnavailableError` after the main model and its fallback are both down), the step runs again as its next attempt from the request messages. Tools that finished in the failed attempt run again.

This is harmless while the Agent step has no tools.

## When the first tool with side effects lands
1. The step record keeps the last `LlmAgentProgress` of a running Agent step (`messages`, `roundsUsed`, `toolCalls`), for example in a nullable `progress` column on `runs.run_steps`, written after each finished round in its own short tenant transaction.
2. `AgentExecutor` gets the progress of the previous attempt and passes it as `resumeFrom`, so the retried job continues the turn within the same round budget.
3. The progress is cleared when the step finishes, so a finished step keeps only its output.
4. A test runs a tool, fails both models, retries the job and checks that the tool ran once.

## Depends on
- Knowledge tools (K3) or the first connector tool.
