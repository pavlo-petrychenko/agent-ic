import type { z } from 'zod';
import type { PublishPreviewQuery } from '@/features/flow-builder/communication/gql/query/publishPreview.generated';
import { toFlowIssues } from '@/features/flow-builder/communication/helpers/draft.helpers';
import {
  diffBranchSchema,
  diffEdgeSchema,
  diffNodeSchema,
} from '@/features/flow-builder/communication/schemas/publish.schema';
import type {
  PublishDiff,
  PublishPreview,
} from '@/features/flow-builder/typedefs/publish.typedefs';

const parseAll = <T>(schema: z.ZodType<T>, values: readonly unknown[]): T[] =>
  values.flatMap((value) => {
    const parsed = schema.safeParse(value);
    return parsed.success ? [parsed.data] : [];
  });

export const toFlowDiff = (diff: PublishPreviewQuery['publishPreview']['diff']): PublishDiff => ({
  addedNodes: parseAll(diffNodeSchema, diff.addedNodes),
  removedNodes: parseAll(diffNodeSchema, diff.removedNodes),
  changedNodes: diff.changedNodes,
  renamedKeys: diff.renamedKeys,
  addedEdges: parseAll(diffEdgeSchema, diff.addedEdges),
  removedEdges: parseAll(diffEdgeSchema, diff.removedEdges),
  changedEdges: parseAll(diffBranchSchema, diff.changedEdges),
  changeCount: diff.changeCount,
});

export const toPublishPreview = ({
  agent,
  publishPreview,
}: PublishPreviewQuery): PublishPreview => ({
  draftNumber: agent.draftNumber,
  liveVersion: agent.liveVersionNumber ?? null,
  diff: toFlowDiff(publishPreview.diff),
  errors: toFlowIssues(publishPreview.errors),
  errorCount: publishPreview.errors.length,
  warnings: toFlowIssues(publishPreview.warnings),
  testedAt: publishPreview.simulator.testedAt ?? null,
});
