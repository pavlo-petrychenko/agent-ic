import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export interface BatchUseCase<TKey, TValue> {
  execute(ctx: UseCaseCtx, keys: readonly TKey[]): Promise<ReadonlyMap<TKey, TValue>>;
}
