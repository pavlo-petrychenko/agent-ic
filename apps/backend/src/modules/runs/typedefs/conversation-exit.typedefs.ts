import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export interface ConversationExit {
  readonly ctx: UseCaseCtx;
  readonly run: Run;
  readonly nodeId: string;
  readonly texts: readonly string[];
}
