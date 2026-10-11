import { FlowIssueCode, FlowIssueSeverity } from '@agent-ic/flow';
import { z } from 'zod';

export const flowIssueSchema = z.object({
  code: z.enum(FlowIssueCode),
  severity: z.enum(FlowIssueSeverity),
  nodeId: z.string().nullable(),
  edgeId: z.string().nullable(),
  path: z.array(z.string()),
  params: z.record(z.string(), z.union([z.string(), z.number()])),
});

export const draftConflictSchema = z.object({
  savedBy: z.string().nullable(),
  savedAt: z.string(),
});
