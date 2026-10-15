import type { PromptLibraryQuery } from '@/features/prompts/communication/gql/query/promptLibrary.generated';
import type { PromptLibrary } from '@/features/prompts/typedefs/prompt.typedefs';

export const toPromptLibrary = (data: PromptLibraryQuery): PromptLibrary => ({
  folders: data.promptFolders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    prompts: folder.prompts.map((prompt) => ({ id: prompt.id, name: prompt.name })),
  })),
});
