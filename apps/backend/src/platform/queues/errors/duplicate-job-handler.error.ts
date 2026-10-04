import { DUPLICATE_JOB_HANDLER_MESSAGE } from '@/platform/queues/constants/job.constants';

export class DuplicateJobHandlerError extends Error {
  constructor(readonly jobKey: string) {
    super(`${DUPLICATE_JOB_HANDLER_MESSAGE} ${jobKey}`);
    this.name = new.target.name;
  }
}
