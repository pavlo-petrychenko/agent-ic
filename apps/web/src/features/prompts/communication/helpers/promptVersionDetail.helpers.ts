import type { PromptVersionQuery } from '@/features/prompts/communication/gql/query/promptVersion.generated';
import type { PromptVersion } from '@/features/prompts/typedefs/prompt.typedefs';

export const toPromptVersionDetail = (data: PromptVersionQuery): PromptVersion => ({
  id: data.promptVersion.id,
  number: data.promptVersion.number,
  text: data.promptVersion.text,
  note: data.promptVersion.note,
  savedAt: data.promptVersion.createdAt,
  author: data.promptVersion.author?.name ?? null,
});
