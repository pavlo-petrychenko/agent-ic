import type { PromptVersionsQuery } from '@/features/prompts/communication/gql/query/promptVersions.generated';
import type { PromptVersionListItem } from '@/features/prompts/typedefs/prompt.typedefs';

export const toPromptVersionList = (data: PromptVersionsQuery): PromptVersionListItem[] =>
  data.promptVersions.map((version) => ({
    id: version.id,
    number: version.number,
    variables: version.variables,
    note: version.note,
    savedAt: version.createdAt,
  }));
