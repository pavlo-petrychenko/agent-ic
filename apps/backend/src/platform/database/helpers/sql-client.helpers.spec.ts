import { describe, expect, it } from 'vitest';
import {
  applicationNameFor,
  detachPoolClient,
} from '@/platform/database/helpers/sql-client.helpers';
import { Role } from '@/platform/module-roles/constants/role.constants';

const IDLE_ERROR_MESSAGE = 'terminating connection due to administrator command';

describe('sql client helpers', () => {
  it('names a pool after its role', () => {
    expect(applicationNameFor(Role.Worker)).toBe('agent-ic-worker');
  });

  it('drops the client that pg-pool attaches to an idle error', () => {
    const error = Object.assign(new Error(IDLE_ERROR_MESSAGE), { client: { secretKey: 1 } });

    const detached = detachPoolClient(error);

    expect(detached).not.toHaveProperty('client');
    expect(detached.message).toBe(IDLE_ERROR_MESSAGE);
  });
});
