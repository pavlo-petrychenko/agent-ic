import type { PromptFolderParent } from '@/modules/prompts/typedefs/prompt-folder-graphql.typedefs';
import type { PromptFolderView } from '@/modules/prompts/typedefs/prompt-folder.typedefs';

export const toGraphqlPromptFolder = (folder: PromptFolderView): PromptFolderParent => ({
  id: folder.id,
  name: folder.name,
  createdAt: folder.createdAt.toISOString(),
  updatedAt: folder.updatedAt.toISOString(),
});
