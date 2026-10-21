import { beforeEach, describe, expect, it } from 'vitest';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { BatchKeyMissingError } from '@/platform/graphql-server/errors/batch-key-missing.error';
import { createGraphqlLoaders } from '@/platform/graphql-server/helpers/graphql-loaders.helpers';
import type {
  BatchUseCaseResolver,
  GraphqlLoaders,
} from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';

interface ExecuteCall {
  readonly ctx: UseCaseCtx;
  readonly keys: readonly string[];
}

const MISSING_KEY = 'run_missing';
const BATCH_FAILURE = new Error('the batch failed');

const calls: ExecuteCall[] = [];

const valueOf = (key: string): string => `value of ${key}`;

class LabelRunsUseCase implements BatchUseCase<string, string> {
  async execute(ctx: UseCaseCtx, keys: readonly string[]): Promise<ReadonlyMap<string, string>> {
    calls.push({ ctx, keys });
    return new Map(keys.filter((key) => key !== MISSING_KEY).map((key) => [key, valueOf(key)]));
  }
}

class FailingRunsUseCase implements BatchUseCase<string, string> {
  async execute(ctx: UseCaseCtx, keys: readonly string[]): Promise<ReadonlyMap<string, string>> {
    calls.push({ ctx, keys });
    throw BATCH_FAILURE;
  }
}

const instantiate: BatchUseCaseResolver = (useCase) => new useCase();

const loadersFor = (ctx: UseCaseCtx): GraphqlLoaders => createGraphqlLoaders(ctx, instantiate);

describe('createGraphqlLoaders', () => {
  const ctx = workspaceSystemCtx('ws_a');

  beforeEach(() => {
    calls.length = 0;
  });

  it('runs the batch use case once for every load made in the same tick', async () => {
    const loaders = loadersFor(ctx);

    const values = await Promise.all(
      ['run_1', 'run_2', 'run_3'].map((key) => loaders.get(LabelRunsUseCase).load(key)),
    );

    expect(values).toEqual([valueOf('run_1'), valueOf('run_2'), valueOf('run_3')]);
    expect(calls).toEqual([{ ctx, keys: ['run_1', 'run_2', 'run_3'] }]);
  });

  it('runs a new batch in a later tick, because nothing is cached', async () => {
    const loader = loadersFor(ctx).get(LabelRunsUseCase);

    await loader.load('run_1');
    await loader.load('run_1');

    expect(calls).toEqual([
      { ctx, keys: ['run_1'] },
      { ctx, keys: ['run_1'] },
    ]);
  });

  it('asks for a repeated key once and gives every load of it the value', async () => {
    const loader = loadersFor(ctx).get(LabelRunsUseCase);

    const values = await Promise.all(['run_1', 'run_1', 'run_2'].map((key) => loader.load(key)));

    expect(values).toEqual([valueOf('run_1'), valueOf('run_1'), valueOf('run_2')]);
    expect(calls).toEqual([{ ctx, keys: ['run_1', 'run_2'] }]);
  });

  it('never shares a loader between two requests', async () => {
    const other = workspaceSystemCtx('ws_b');

    await Promise.all([
      loadersFor(ctx).get(LabelRunsUseCase).load('run_1'),
      loadersFor(other).get(LabelRunsUseCase).load('run_2'),
    ]);

    expect(calls).toEqual([
      { ctx, keys: ['run_1'] },
      { ctx: other, keys: ['run_2'] },
    ]);
  });

  it('fails only the key that the batch use case left out', async () => {
    const loader = loadersFor(ctx).get(LabelRunsUseCase);

    const [found, missing] = await Promise.allSettled([
      loader.load('run_1'),
      loader.load(MISSING_KEY),
    ]);

    expect(found).toEqual({ status: 'fulfilled', value: valueOf('run_1') });
    expect(missing).toMatchObject({ status: 'rejected', reason: expect.any(BatchKeyMissingError) });
  });

  it('rejects every key of the batch with the error the batch use case threw', async () => {
    const loader = loadersFor(ctx).get(FailingRunsUseCase);

    const results = await Promise.allSettled([loader.load('run_1'), loader.load('run_2')]);

    expect(results).toEqual([
      { status: 'rejected', reason: BATCH_FAILURE },
      { status: 'rejected', reason: BATCH_FAILURE },
    ]);
    expect(calls).toHaveLength(1);
  });
});
