export enum CliOption {
  Role = 'role',
  Queues = 'queues',
  Output = 'output',
}

export const STRING_OPTION = { type: 'string' } as const;
export const QUEUE_LIST_SEPARATOR = ',';
export const CLI_OPTION_PREFIX = '--';
export const CLI_ARGUMENTS_LABEL = 'arguments';
export const WORKER_QUEUES_REQUIRED_MESSAGE = 'at least one queue is required for the worker role';
