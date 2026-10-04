import { describe, expect, it } from 'vitest';
import { JOB_KEY_SEPARATOR } from '@/platform/queues/constants/job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob, isJobHandler, jobKey } from '@/platform/queues/helpers/job.helpers';
import { ProbeJobName } from '@test/support/constants/async-jobs.constants';
import { probeDataSchema } from '@test/support/schemas/async-jobs.schema';

describe('defineJob', () => {
  it('returns a frozen definition with the given queue, name and schema', () => {
    const job = defineJob({
      queue: QueueName.Notify,
      name: ProbeJobName.Record,
      schema: probeDataSchema,
    });

    expect(job).toEqual({
      queue: QueueName.Notify,
      name: ProbeJobName.Record,
      schema: probeDataSchema,
    });
    expect(Object.isFrozen(job)).toBe(true);
  });
});

describe('jobKey', () => {
  it('joins the queue and the job name', () => {
    expect(jobKey(QueueName.Notify, ProbeJobName.Record)).toBe(
      `${QueueName.Notify}${JOB_KEY_SEPARATOR}${ProbeJobName.Record}`,
    );
  });
});

describe('isJobHandler', () => {
  it('accepts an object with a handle method', () => {
    expect(isJobHandler({ handle: () => Promise.resolve() })).toBe(true);
  });

  it.each([null, undefined, {}, { handle: true }])('rejects %s', (value) => {
    expect(isJobHandler(value)).toBe(false);
  });
});
