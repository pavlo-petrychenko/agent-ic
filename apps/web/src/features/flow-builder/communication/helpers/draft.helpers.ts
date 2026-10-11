import { ErrorReason } from '@agent-ic/contracts';
import { parseFlow, validateFlow } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import type { SaveAgentDraftMutation } from '@/features/flow-builder/communication/gql/mutation/saveAgentDraft.generated';
import type { FlowBuilderDraftQuery } from '@/features/flow-builder/communication/gql/query/flowBuilderDraft.generated';
import {
  draftConflictSchema,
  flowIssueSchema,
} from '@/features/flow-builder/communication/schemas/draft.schema';
import type { DraftConflict, SavedDraft } from '@/features/flow-builder/typedefs/autosave.typedefs';
import type { FlowDraft } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';
import type { AppError } from '@/shared/api/errors/app.error';

export const toFlowDraft = (agentDraft: FlowBuilderDraftQuery['agentDraft']): FlowDraft | null => {
  const parsed = parseFlow(agentDraft.version.flow);
  return parsed.ok
    ? {
        document: parsed.flow,
        revision: agentDraft.revision,
        issues: validateFlow(parsed.flow),
      }
    : null;
};

const toFlowIssues = (issues: readonly unknown[]): FlowIssue[] =>
  issues.flatMap((issue) => {
    const parsed = flowIssueSchema.safeParse(issue);
    return parsed.success ? [parsed.data] : [];
  });

export const toSavedDraft = (saved: SaveAgentDraftMutation['saveAgentDraft']): SavedDraft => ({
  revision: saved.revision,
  issues: toFlowIssues(saved.issues),
});

export const toDraftConflict = (error: AppError): DraftConflict | null => {
  if (error.reason !== ErrorReason.DraftConflict) {
    return null;
  }
  const parsed = draftConflictSchema.safeParse(error.details);
  return parsed.success ? parsed.data : { savedBy: null, savedAt: null };
};
