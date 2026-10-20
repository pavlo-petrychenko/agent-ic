import type { Type } from '@nestjs/common';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';

export type AnyBatchUseCase = BatchUseCase<unknown, unknown>;

export type BatchUseCaseClass<TUseCase extends AnyBatchUseCase = AnyBatchUseCase> = Type<TUseCase>;

export interface BatchLoader<TKey, TValue> {
  load(key: TKey): Promise<TValue>;
}

export type LoaderOf<TUseCase extends AnyBatchUseCase> =
  TUseCase extends BatchUseCase<infer TKey, infer TValue> ? BatchLoader<TKey, TValue> : never;

export interface GraphqlLoaders {
  get<TUseCase extends AnyBatchUseCase>(useCase: BatchUseCaseClass<TUseCase>): LoaderOf<TUseCase>;
}

export type BatchUseCaseResolver = <TUseCase extends AnyBatchUseCase>(
  useCase: BatchUseCaseClass<TUseCase>,
) => TUseCase;

export type GraphqlParent<TType, TField extends keyof TType> = Omit<TType, TField>;
