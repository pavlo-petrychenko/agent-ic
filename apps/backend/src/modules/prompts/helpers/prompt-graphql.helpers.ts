import { PromptVersionKind } from '@agent-ic/flow';
import { PromptUsageVersionKind } from '@/modules/prompts/constants/prompt-usage.constants';
import type { PromptUsage } from '@/modules/prompts/typedefs/prompt-usage.typedefs';
import type { PromptVersionView } from '@/modules/prompts/typedefs/prompt-version.typedefs';
import type { PromptDetailView, PromptView } from '@/modules/prompts/typedefs/prompt.typedefs';
import {
  PromptPinKind as GraphqlPromptPinKind,
  PromptUsageVersionKind as GraphqlPromptUsageVersionKind,
} from '@/platform/graphql-server/generated/schema.generated';
import type {
  Prompt,
  PromptDetail,
  PromptUsage as GraphqlPromptUsage,
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
  variables: version.variables,
  note: version.note,
  author: version.author,
  createdAt: version.createdAt.toISOString(),
});

export const toGraphqlPromptDetail = (detail: PromptDetailView): PromptDetail => ({
  prompt: toGraphqlPrompt(detail.prompt),
  latestVersion:
    detail.latestVersion === null ? null : toGraphqlPromptVersion(detail.latestVersion),
});

const GRAPHQL_USAGE_VERSION_KIND: Readonly<
  Record<PromptUsageVersionKind, GraphqlPromptUsageVersionKind>
> = {
  [PromptUsageVersionKind.Draft]: GraphqlPromptUsageVersionKind.Draft,
  [PromptUsageVersionKind.Live]: GraphqlPromptUsageVersionKind.Live,
};

const GRAPHQL_PIN_KIND: Readonly<Record<PromptVersionKind, GraphqlPromptPinKind>> = {
  [PromptVersionKind.Pinned]: GraphqlPromptPinKind.Pinned,
  [PromptVersionKind.Latest]: GraphqlPromptPinKind.Latest,
};

export const toGraphqlPromptUsage = (usage: PromptUsage): GraphqlPromptUsage => ({
  agentId: usage.agentId,
  agentName: usage.agentName,
  versionId: usage.versionId,
  versionKind: GRAPHQL_USAGE_VERSION_KIND[usage.versionKind],
  versionNumber: usage.versionNumber,
  nodeId: usage.nodeId,
  nodeKey: usage.nodeKey,
  nodeLabel: usage.nodeLabel,
  pin: {
    kind: GRAPHQL_PIN_KIND[usage.pin.kind],
    number: usage.pin.kind === PromptVersionKind.Pinned ? usage.pin.number : null,
  },
});
