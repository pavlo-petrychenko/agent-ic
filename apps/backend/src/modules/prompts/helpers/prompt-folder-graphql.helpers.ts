import type { PromptFolderView } from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import type { PromptFolder } from '@/platform/graphql-server/generated/schema.generated';

export const toGraphqlPromptFolder = (folder: PromptFolderView): PromptFolder => ({
  id: folder.id,
  name: folder.name,
  createdAt: folder.createdAt.toISOString(),
  updatedAt: folder.updatedAt.toISOString(),
});
