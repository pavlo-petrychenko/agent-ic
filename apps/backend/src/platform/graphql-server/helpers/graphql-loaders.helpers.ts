import DataLoader from 'dataloader';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { BatchKeyMissingError } from '@/platform/graphql-server/errors/batch-key-missing.error';
import type {
  AnyBatchUseCase,
  BatchLoader,
  BatchUseCaseClass,
  BatchUseCaseResolver,
  GraphqlLoaders,
  LoaderOf,
} from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

const inKeyOrder = <TKey, TValue>(
  useCase: string,
  keys: readonly TKey[],
  values: ReadonlyMap<TKey, TValue>,
): (TValue | Error)[] => {
  const found = new Map(Array.from(values, ([key, value]) => [key, { value }]));
  return keys.map((key) => {
    const entry = found.get(key);
    return entry === undefined ? new BatchKeyMissingError(useCase, key) : entry.value;
  });
};

const batchLoader = <TKey, TValue>(
  ctx: UseCaseCtx,
  useCase: BatchUseCase<TKey, TValue>,
  name: string,
): BatchLoader<TKey, TValue> =>
  new DataLoader<TKey, TValue>(
    async (keys) => inKeyOrder(name, keys, await useCase.execute(ctx, [...new Set(keys)])),
    { cache: false },
  );

export const createGraphqlLoaders = (
  ctx: UseCaseCtx,
  resolve: BatchUseCaseResolver,
): GraphqlLoaders => {
  const loaders = new Map<BatchUseCaseClass, BatchLoader<unknown, unknown>>();
  return {
    get: <TUseCase extends AnyBatchUseCase>(
      useCase: BatchUseCaseClass<TUseCase>,
    ): LoaderOf<TUseCase> => {
      const loader = loaders.get(useCase) ?? batchLoader(ctx, resolve(useCase), useCase.name);
      loaders.set(useCase, loader);
      return loader as LoaderOf<TUseCase>;
    },
  };
};
