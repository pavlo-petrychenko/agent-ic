import { ClsServiceManager } from 'nestjs-cls';
import { AFTER_COMMIT_CLS_KEY } from '@/platform/database/constants/after-commit.constants';
import type {
  AfterCommitAction,
  AfterCommitBuffer,
  TransactionFn,
} from '@/platform/database/typedefs/after-commit.typedefs';

export const createAfterCommitBuffer = (): AfterCommitBuffer => ({ actions: [], open: true });

export const addToAfterCommitBuffer = (
  buffer: AfterCommitBuffer,
  action: AfterCommitAction,
): void => {
  buffer.actions.push(action);
};

export const moveAfterCommitBuffer = (
  buffer: AfterCommitBuffer,
  parent: AfterCommitBuffer,
): void => {
  buffer.open = false;
  for (const action of buffer.actions.splice(0)) {
    addToAfterCommitBuffer(parent, action);
  }
};

export const discardAfterCommitBuffer = (buffer: AfterCommitBuffer): void => {
  buffer.open = false;
  buffer.actions.length = 0;
};

export const flushAfterCommitBuffer = async (buffer: AfterCommitBuffer): Promise<void> => {
  buffer.open = false;
  for (const action of buffer.actions.splice(0)) {
    await action();
  }
};

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
    discardAfterCommitBuffer(buffer);
    throw error;
  }
  await onCommit();
  return result;
};
