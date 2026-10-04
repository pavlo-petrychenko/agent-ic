import type { UseCaseCtx } from '@/platform/context/use-case-ctx';
import type { ProbeListener } from '@test/support/constants/async-jobs.constants';

export interface ProbeCall {
  readonly listener: ProbeListener;
  readonly probeId: string;
  readonly ctx: UseCaseCtx;
}

export type ProbeData = { readonly probeId: string };
