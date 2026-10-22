import { collectPromptVariables } from '@agent-ic/flow';
import type {
  PromptVersion,
  PromptVersionLabels,
  PromptVersionView,
} from '@/modules/prompts/typedefs/prompt-version.typedefs';

export const promptVersionAuthorIds = (versions: readonly PromptVersion[]): string[] => [
  ...new Set(versions.flatMap((version) => (version.authorId === null ? [] : [version.authorId]))),
];

export const toPromptVersionView = (
  version: PromptVersion,
  labels: PromptVersionLabels,
): PromptVersionView => ({
  id: labels.id,
  number: version.number,
  text: version.text,
  variables: collectPromptVariables(version.text),
  note: version.note,
  author: labels.author,
  createdAt: version.createdAt,
});
