import { ErrorReason, IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { KnowledgeSourceKind } from '@/modules/knowledge/constants/knowledge.constants';
import { KnowledgeConnectionInUseError } from '@/modules/knowledge/errors/knowledge-connection-in-use.error';
import { KnowledgeConnectionNotFoundError } from '@/modules/knowledge/errors/knowledge-connection-not-found.error';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DisconnectGoogleConnectionUseCase } from '@/modules/knowledge/use-cases/disconnect-google-connection.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeConnectionId,
  seedKnowledgeBase,
  seedKnowledgeConnection,
  seedKnowledgeSource,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

describe('DisconnectGoogleConnectionUseCase', () => {
  let testbed: KnowledgeTestbed;
  let disconnect: DisconnectGoogleConnectionUseCase;
  let connections: ConnectionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testbed = await createKnowledgeTestbed();
    disconnect = testbed.module.get(DisconnectGoogleConnectionUseCase);
    connections = testbed.module.get(ConnectionsRepository);
    tenants = testbed.module.get(TenantTransactionService);
    ids = testbed.module.get(IdService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('deletes a connection no source uses', async () => {
    const workspaceId = ids.generate();
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);

    const result = await disconnect.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeConnectionId(testbed, connectionId),
    });

    expect(result).toEqual({ id: publicKnowledgeConnectionId(testbed, connectionId) });
    expect(
      await tenants.run(workspaceId, () => connections.findById(workspaceId, connectionId)),
    ).toBeNull();
  });

  it('refuses a connection that a source still uses', async () => {
    const workspaceId = ids.generate();
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    await seedKnowledgeSource(testbed, workspaceId, knowledgeBaseId, {
      kind: KnowledgeSourceKind.GoogleDocs,
      connectionId,
    });

    const attempt = disconnect.execute(knowledgeCtx(workspaceId), {
      id: publicKnowledgeConnectionId(testbed, connectionId),
    });

    await expect(attempt).rejects.toBeInstanceOf(KnowledgeConnectionInUseError);
    await expect(attempt).rejects.toMatchObject({
      reason: ErrorReason.KnowledgeConnectionInUse,
    });
  });

  it('refuses an unknown connection', async () => {
    const workspaceId = ids.generate();
    const missingId = ids.toPublic(IdPrefix.KnowledgeConnection, ids.generate());

    const attempt = disconnect.execute(knowledgeCtx(workspaceId), { id: missingId });

    await expect(attempt).rejects.toBeInstanceOf(KnowledgeConnectionNotFoundError);
  });
});
