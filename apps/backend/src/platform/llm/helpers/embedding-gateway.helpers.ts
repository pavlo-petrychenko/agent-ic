import { LLM_NO_USAGE } from '@/platform/llm/constants/llm-gateway.constants';

export const toBatches = <T>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

export const reportedTokens = (tokens: number): number =>
  Number.isFinite(tokens) ? tokens : LLM_NO_USAGE.inputTokens;
