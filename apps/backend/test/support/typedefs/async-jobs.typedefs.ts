import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { ProbeListener } from '@test/support/constants/async-jobs.constants';

export interface ProbeCall {
  readonly listener: ProbeListener;
  readonly probeId: string;
  readonly ctx: UseCaseCtx;
}

export type ProbeData = { readonly probeId: string };
