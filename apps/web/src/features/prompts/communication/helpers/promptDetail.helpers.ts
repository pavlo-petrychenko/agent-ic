import type { PromptDetailQuery } from '@/features/prompts/communication/gql/query/promptDetail.generated';
import type { PromptDetail } from '@/features/prompts/typedefs/prompt.typedefs';

export const toPromptDetail = (data: PromptDetailQuery): PromptDetail => {
  const { prompt, latestVersion } = data.prompt;

  return {
    prompt: {
      id: prompt.id,
      name: prompt.name,
      folderId: prompt.folderId,
      latestVersionNumber: latestVersion?.number ?? null,
      updatedAt: prompt.updatedAt,
    },
    latestVersion:
      latestVersion === null
        ? null
        : {
            id: latestVersion.id,
            number: latestVersion.number,
            text: latestVersion.text,
            savedAt: latestVersion.createdAt,
            author: latestVersion.author?.name ?? null,
          },
  };
};
