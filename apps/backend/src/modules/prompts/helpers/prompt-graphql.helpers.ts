import type { PromptView } from '@/modules/prompts/typedefs/prompt.typedefs';
import type { Prompt } from '@/platform/graphql-server/generated/schema.generated';

export const toGraphqlPrompt = (prompt: PromptView): Prompt => ({
  id: prompt.id,
  name: prompt.name,
  folderId: prompt.folderId,
  createdAt: prompt.createdAt.toISOString(),
  updatedAt: prompt.updatedAt.toISOString(),
});
