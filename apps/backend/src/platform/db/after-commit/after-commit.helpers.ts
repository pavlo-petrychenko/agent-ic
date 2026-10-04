import { ClsServiceManager } from 'nestjs-cls';

import type { AfterCommitBuffer } from './after-commit.buffer';
import { AFTER_COMMIT_CLS_KEY } from './after-commit.constants';
import type { TransactionFn } from './after-commit.typedefs';

export const currentAfterCommitBuffer = (): AfterCommitBuffer | undefined =>
  ClsServiceManager.getClsService().get<AfterCommitBuffer | undefined>(AFTER_COMMIT_CLS_KEY);

export const bindAfterCommitBuffer =
  (buffer: AfterCommitBuffer, fn: TransactionFn): TransactionFn =>
  (...args) => {
    ClsServiceManager.getClsService().set(AFTER_COMMIT_CLS_KEY, buffer);
    return fn(...args);
  };

export const settleTransaction = async <TResult>(
  buffer: AfterCommitBuffer,
  work: Promise<TResult>,
  onCommit: () => Promise<void>,
): Promise<TResult> => {
  let result: TResult;
  try {
    result = await work;
  } catch (error) {
    buffer.discard();
    throw error;
  }
  await onCommit();
  return result;
};
