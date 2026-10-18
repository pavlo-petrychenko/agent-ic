import type { PromptUsagesQuery } from '@/features/prompts/communication/gql/query/promptUsages.generated';
import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';
import { PromptPinKind, PromptUsageVersionKind } from '@/shared/api/generated/schema.generated';

export const toPromptUsageList = (data: PromptUsagesQuery): PromptUsageItem[] =>
  data.promptUsages.map((usage) => ({
    agentId: usage.agentId,
    agentName: usage.agentName,
    versionId: usage.versionId,
    live: usage.versionKind === PromptUsageVersionKind.Live,
    versionNumber: usage.versionNumber,
    nodeId: usage.nodeId,
    nodeKey: usage.nodeKey,
    nodeLabel: usage.nodeLabel,
    pinned: usage.pin.kind === PromptPinKind.Pinned,
    pinNumber: usage.pin.number,
  }));
