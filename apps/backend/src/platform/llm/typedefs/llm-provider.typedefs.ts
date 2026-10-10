import type { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';

export type LlmProviderSource =
  | { readonly kind: LlmProviderKind.Platform }
  | { readonly kind: LlmProviderKind.Workspace; readonly workspaceId: string };
