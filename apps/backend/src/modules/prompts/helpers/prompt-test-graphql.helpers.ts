import type { PromptTestResult } from '@/modules/prompts/typedefs/prompt-test.typedefs';
import type {
  PromptTestResult as GraphqlPromptTestResult,
  PromptTestUsage as GraphqlPromptTestUsage,
} from '@/platform/graphql-server/generated/schema.generated';

export const toGraphqlPromptTestUsage = (
  usage: PromptTestResult['usage'],
): GraphqlPromptTestUsage => ({
  inputTokens: usage.inputTokens,
  outputTokens: usage.outputTokens,
});

export const toGraphqlPromptTestResult = (result: PromptTestResult): GraphqlPromptTestResult => ({
  output: result.output,
  model: result.model,
  usage: toGraphqlPromptTestUsage(result.usage),
  durationMs: result.durationMs,
});
