# 015 Calling the LLM

[Back to the docs](../README.md)

Every call to a language model goes through one platform service, `LlmGateway`. It picks the provider, asks each model for a structured answer the way that model handles best, checks the answer, and falls back to another model when the first one is down.

## What it is

- `LlmGateway` is an abstract class in [platform/llm](../../apps/backend/src/platform/llm/). `LlmModule` is global and binds it to `AiSdkLlmGateway`, built on the AI SDK (`ai`), its OpenAI-compatible provider and its Anthropic provider.
- `complete({ provider, model, purpose, system, messages, output, reasoning?, tags })` asks for one structured answer, with no tools. It returns `{ output, model, usage }`: the answer checked against the zod `output`, the model that gave it, and the tokens spent.
- `runAgent({ ...the same, tools, maxToolRounds })` runs a tool loop. An agent is chat-based: it ends with a final answer, not a tool. It returns `{ output, model, usage, toolCalls }`.
- The models we offer are a constant: [llm-catalog.constants.ts](../../apps/backend/src/platform/llm/constants/llm-catalog.constants.ts) (D90, D194). Each model has a vendor, the purposes it serves (`conversation`, `light`), a price, a fallback from another vendor, and how the gateway calls it: `api`, `structuredOutput`, `agentFinish`, the `reasoningLevels` it accepts and its default `reasoningEffort` (D91).
- Locally the platform provider is LLMAPI: put a key in `LLM_API_KEY` in `.env`. Without a key the app still boots, and a call fails with `LlmNotConfiguredError`.

## Why we have it

- One place decides the provider (`ProviderResolverService`), so bring-your-own keys (U2) plug in there and nowhere else.
- Models differ. Through LLMAPI, chat completions drops the JSON schema for Claude, some models ignore or reject `json_schema`, and open-weight hosts stop calling tools when a schema is sent with them. Each model gets the native path it supports, and a workaround only where native fails (D91).
- A model can be slow or down. A customer still needs an answer, so the gateway tries a second model before it gives up (D83).

## How it works

```
complete(request) / runAgent(request)
  for model in [request.model, its fallback]      (platform provider only)
    api: chat-completions -> /chat/completions, anthropic-messages -> /messages (Claude)
    complete, or runAgent on a final-message model:
      tools + native output (json_schema, or json_object with the schema in the prompt)
      answer without a tool call   -> check with zod, one retry with the error
    runAgent on a reply-tool model:
      tools + a `reply` tool whose input is the output schema, no response_format
      reply called                 -> check with zod, one retry with the error
      plain text                   -> one nudge to call reply, then LlmReplyMissingError
    still calling tools after maxToolRounds -> LlmToolRoundsExceededError
    429, 5xx or timeout            -> try the next model, with its own path
    any other failure              -> throw it (a 4xx becomes UpstreamError)
  every model unavailable          -> LlmUnavailableError
```

1. **Paths.** The catalog decides per model. `structuredOutput: json-schema` sends the schema natively; `json-object` sends `json_object` and puts the schema in the system prompt. `agentFinish: final-message` ends a run on the answer; `reply-tool` ends it on the `reply` tool call. Reasoning: a call may pass `reasoning`; each model gets the nearest level it supports (the lower one on a tie), its catalog default when none is passed, and nothing when it has no levels, with or without tools. The fallback model gets its own nearest level.
2. **Checks.** Every answer is parsed and checked with zod. A wrong answer gets one more round with the error; a second wrong answer is `LlmOutputInvalidError`.
3. **Rounds.** A round is one model call, tools included. Retries and the nudge spend the same `maxToolRounds` budget.
4. **Timeouts.** Each round has a time limit by the `purpose` of the call, in `LLM_STEP_TIMEOUT_MS`: 30 seconds for `conversation`, 15 for `light`.
5. **Fallback.** On 429, a 5xx or a timeout, the gateway starts again on the model's fallback, with the original messages. It never retries the same model: the job retry does that later. Workspace providers have no fallback in the MVP (D83).
6. **`LlmUnavailableError`** has the kind `Unavailable`. In a job it retries with backoff instead of giving up. On GraphQL and REST it is `UPSTREAM_ERROR` with HTTP 503. Its details name the models tried, and its cause holds each failure.

## Tracing

- When `LANGFUSE_MODE` is not `off` and the OTel SDK runs (`OTEL_SDK_DISABLED` is not `true`), each call is traced at the `LANGFUSE_SAMPLE_RATE`, and the spans go through the OTel Collector to Langfuse (D47, D201). The decision is made once per call, so a call that falls back records every model attempt or none. Otherwise nothing is traced.
- `tags` name the trace: `traceName` and `workspaceId`, and when known `sessionId` (the conversation), `agentVersionId`, `promptId` and `promptVersion`. Each model attempt's span also says which model it was, its `fallback_hop` and the `reasoning` level it got.
- To group several calls into one trace, wrap them in `LlmTraceContextService.run(tags, async (traceId) => …)`. It samples once for the whole trace, starts a new trace even inside a traced HTTP request, and gives you the trace id to store, or `null` when the trace is not recorded.

## Add a call

- [ ] Inject `LlmGateway` (the abstract class), not `AiSdkLlmGateway`.
- [ ] Describe the answer with a zod schema. Keep it small and flat; the model fills it.
- [ ] Use `complete` when the model needs no tools, `runAgent` when it does.
- [ ] Pass the whole conversation as `messages`. Never cut the history.
- [ ] Fill `tags`, so the call can be found in Langfuse.
- [ ] Save `model` and `usage` where you record the result, so a run shows which model answered and what it cost.
- [ ] In a spec, start the mock with `startMockLlm()` and script it: `json(value)`, `text(s)`, `toolCall(name, args)`, `reply(args)`, `fail(status)`, `hang()`. It answers chat completions and the Anthropic messages API, and `body(i)` and `toolNames(i)` show what was sent. Give the gateway short timeouts, as [ai-sdk-llm.gateway.spec.ts](../../apps/backend/src/platform/llm/gateways/ai-sdk-llm.gateway.spec.ts) does.

## In the code

- [ai-sdk-llm.gateway.ts](../../apps/backend/src/platform/llm/gateways/ai-sdk-llm.gateway.ts): the loop over models and the two run paths.
- [llm-gateway.helpers.ts](../../apps/backend/src/platform/llm/helpers/llm-gateway.helpers.ts): the output format, the reply tool, which models to try and which failures fall back.
- [llm-provider.helpers.ts](../../apps/backend/src/platform/llm/helpers/llm-provider.helpers.ts): one provider per `api`.
- [llm-gateway.constants.ts](../../apps/backend/src/platform/llm/constants/llm-gateway.constants.ts): the timeouts, retries and prompts.
- [mock-llm.service.ts](../../apps/backend/test/support/services/mock-llm.service.ts): the in-process LLM server for specs.

## Pitfalls

- **Tools can run twice.** After a timeout the fallback model starts again, and it may call the same tools. Keep tools read-only or safe to repeat.
- **A 400 does not fall back.** A bad request fails on every model, so it surfaces at once as an `UpstreamError` that is not retryable, and a job gives up at once.
- **Do not send sampling params.** The gateway sends no `temperature`, `top_p` or `top_k`; Claude Haiku rejects them.
- **Do not wrap the gateway in your own retry.** A job already retries `LlmUnavailableError`; a second loop multiplies the wait and the cost.

Next: look at real code in the examples, starting with [the identity module](../examples/identity-module.md). The list is in [the examples section](../README.md#examples) of the docs entry page.
