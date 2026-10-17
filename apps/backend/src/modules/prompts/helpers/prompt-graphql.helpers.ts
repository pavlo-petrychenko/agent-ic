import type { PromptVersionView } from '@/modules/prompts/typedefs/prompt-version.typedefs';
import type { PromptDetailView, PromptView } from '@/modules/prompts/typedefs/prompt.typedefs';
import type {
  Prompt,
  PromptDetail,
  PromptVersion,
} from '@/platform/graphql-server/generated/schema.generated';

export const toGraphqlPrompt = (prompt: PromptView): Prompt => ({
  id: prompt.id,
  name: prompt.name,
  folderId: prompt.folderId,
  latestVersionNumber: prompt.latestVersionNumber,
  createdAt: prompt.createdAt.toISOString(),
  updatedAt: prompt.updatedAt.toISOString(),
});

export const toGraphqlPrompts = (prompts: PromptView[]): Prompt[] => prompts.map(toGraphqlPrompt);

export const toGraphqlPromptVersion = (version: PromptVersionView): PromptVersion => ({
  id: version.id,
  number: version.number,
  text: version.text,
  note: version.note,
  author: version.author,
  createdAt: version.createdAt.toISOString(),
});

export const toGraphqlPromptDetail = (detail: PromptDetailView): PromptDetail => ({
  prompt: toGraphqlPrompt(detail.prompt),
  latestVersion:
    detail.latestVersion === null ? null : toGraphqlPromptVersion(detail.latestVersion),
});
