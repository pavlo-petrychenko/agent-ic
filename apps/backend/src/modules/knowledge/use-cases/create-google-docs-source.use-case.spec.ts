import { IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncInterval,
  KnowledgeSyncStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { GoogleDocsSelectionInvalidError } from '@/modules/knowledge/errors/google-drive.error';
import { GoogleDriveGateway } from '@/modules/knowledge/gateways/google-drive.gateway';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import { knowledgeSyncSchedulerId } from '@/modules/knowledge/helpers/knowledge-schedule.helpers';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import type { GoogleDriveFile } from '@/modules/knowledge/typedefs/google-drive.typedefs';
import { CreateGoogleDocsSourceUseCase } from '@/modules/knowledge/use-cases/create-google-docs-source.use-case';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { QueuesService } from '@/platform/queues/services/queues.service';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';
import {
  TEST_GOOGLE_DOC_ID,
  TEST_GOOGLE_DOC_MARKDOWN,
  TEST_GOOGLE_DOC_MIME_TYPE,
  TEST_GOOGLE_DOC_MODIFIED_AT,
  TEST_GOOGLE_DOC_NAME,
  TEST_GOOGLE_DOC_URL,
  TEST_GOOGLE_DOC_VERSION,
  TEST_GOOGLE_REFRESH_TOKEN,
} from '@test/support/constants/knowledge-testing.constants';
import { FakeGoogleDriveGateway } from '@test/support/fakes/google-drive.fake';
import { FakeGoogleOAuthGateway } from '@test/support/fakes/google-oauth.fake';
import {
  createKnowledgeTestbed,
  knowledgeCtx,
  publicKnowledgeBaseId,
  publicKnowledgeConnectionId,
  seedKnowledgeBase,
  seedKnowledgeConnection,
} from '@test/support/helpers/knowledge-testing.helpers';
import type { KnowledgeTestbed } from '@test/support/typedefs/knowledge-testing.typedefs';

const file = (overrides: Partial<GoogleDriveFile> = {}): GoogleDriveFile => ({
  id: TEST_GOOGLE_DOC_ID,
  name: TEST_GOOGLE_DOC_NAME,
  mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
  webViewLink: TEST_GOOGLE_DOC_URL,
  modifiedTime: TEST_GOOGLE_DOC_MODIFIED_AT,
  version: TEST_GOOGLE_DOC_VERSION,
  trashed: false,
  ...overrides,
});

const picked = (id: string, name: string) => ({
  id,
  name,
  mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
  url: null,
  resourceKey: null,
});

describe('CreateGoogleDocsSourceUseCase', () => {
  let testbed: KnowledgeTestbed;
  let drive: FakeGoogleDriveGateway;
  let connections: ConnectionsRepository;
  let sources: SourcesRepository;
  let documents: DocumentsRepository;
  let syncRuns: SyncRunsRepository;
  let secrets: SecretBoxService;
  let createSource: CreateGoogleDocsSourceUseCase;

  beforeAll(async () => {
    drive = new FakeGoogleDriveGateway();
    testbed = await createKnowledgeTestbed([
      { token: GoogleOAuthGateway, value: new FakeGoogleOAuthGateway() },
      { token: GoogleDriveGateway, value: drive },
    ]);
    connections = testbed.module.get(ConnectionsRepository);
    sources = testbed.module.get(SourcesRepository);
    documents = testbed.module.get(DocumentsRepository);
    syncRuns = testbed.module.get(SyncRunsRepository);
    secrets = testbed.module.get(SecretBoxService);
    createSource = testbed.module.get(CreateGoogleDocsSourceUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seedConnection = async (workspaceId: string): Promise<string> => {
    const connectionId = await seedKnowledgeConnection(testbed, workspaceId);
    await testbed.tenants.run(workspaceId, () =>
      connections.update(workspaceId, connectionId, {
        sealedRefreshToken: secrets.seal(TEST_GOOGLE_REFRESH_TOKEN),
      }),
    );
    return connectionId;
  };

  it('creates one source with the valid picked documents and reports skipped ones', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedConnection(workspaceId);
    drive.addFile(file(), TEST_GOOGLE_DOC_MARKDOWN);
    drive.addFile(
      file({ id: 'google-doc-2', name: 'Prices' }),
      '# Prices\n\nOur prices are listed here.',
    );
    drive.addFile(
      file({
        id: 'google-doc-3',
        name: 'Sheet',
        mimeType: 'application/vnd.google-apps.spreadsheet',
      }),
      '',
    );
    drive.addFile(file({ id: 'google-doc-4', name: 'Trashed', trashed: true }), '');
    drive.setUnavailable('google-doc-5');

    const result = await createSource.execute(knowledgeCtx(workspaceId), {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      connectionId: publicKnowledgeConnectionId(testbed, connectionId),
      documents: [
        {
          id: 'google-doc-1',
          name: 'Policies',
          mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
          url: null,
          resourceKey: null,
        },
        {
          id: 'google-doc-2',
          name: 'Prices',
          mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
          url: null,
          resourceKey: null,
        },
        {
          id: 'google-doc-3',
          name: 'Sheet',
          mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
          url: null,
          resourceKey: null,
        },
        {
          id: 'google-doc-4',
          name: 'Trashed',
          mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
          url: null,
          resourceKey: null,
        },
        {
          id: 'google-doc-5',
          name: 'Missing',
          mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
          url: null,
          resourceKey: null,
        },
      ],
    });

    const source = result.source;
    expect(source).toMatchObject({
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      kind: KnowledgeSourceKind.GoogleDocs,
      status: KnowledgeSourceStatus.Pending,
      title: 'Google Docs (2)',
    });
    expect(result.skipped.map((document) => document.reason)).toEqual([
      'unsupported',
      'trashed',
      'unavailable',
    ]);
    const sourceId = testbed.ids.fromPublic(IdPrefix.KnowledgeSource, source.id);
    const stored = await testbed.tenants.run(workspaceId, async () => ({
      sources: await sources.listByKnowledgeBase(workspaceId, knowledgeBaseId),
      documents: await documents.listBySource(workspaceId, sourceId),
      runs: await syncRuns.findLatestBySource(workspaceId, sourceId),
    }));
    expect(stored.sources).toHaveLength(1);
    expect(stored.sources[0]).toMatchObject({
      connectionId,
      kind: KnowledgeSourceKind.GoogleDocs,
      status: KnowledgeSourceStatus.Pending,
    });
    expect(
      stored.documents
        .map((document) => document.externalId)
        .toSorted((left, right) => String(left).localeCompare(String(right))),
    ).toEqual(['google-doc-1', 'google-doc-2']);
    expect(
      stored.documents.every((document) => document.status === KnowledgeDocumentStatus.Pending),
    ).toBe(true);
    expect(stored.documents.every((document) => document.originalStorageKey === null)).toBe(true);
    expect(stored.documents.every((document) => document.sizeBytes === null)).toBe(true);
    expect(drive.exportRequests).toEqual([]);
    expect(stored.runs).toMatchObject({
      status: KnowledgeSyncStatus.Queued,
      documentsTotal: 2,
    });
  });

  it('stores an hourly schedule with the next run on the hour', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedConnection(workspaceId);
    drive.addFile(file(), TEST_GOOGLE_DOC_MARKDOWN);

    const result = await createSource.execute(knowledgeCtx(workspaceId), {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      connectionId: publicKnowledgeConnectionId(testbed, connectionId),
      documents: [picked(TEST_GOOGLE_DOC_ID, TEST_GOOGLE_DOC_NAME)],
      syncInterval: KnowledgeSyncInterval.Hourly,
    });
    const sourceId = testbed.ids.fromPublic(IdPrefix.KnowledgeSource, result.source.id);
    const queue = testbed.module.get(QueuesService).get(QueueName.Ingest);
    await queue.removeJobScheduler(knowledgeSyncSchedulerId(sourceId));
    await queue.drain();
    await queue.clean(0, 0, 'delayed');

    expect(result.source).toMatchObject({
      syncInterval: KnowledgeSyncInterval.Hourly,
      syncTime: null,
      syncWeekday: null,
      timezone: 'Europe/Kyiv',
      nextSyncAt: new Date('2026-05-01T10:00:00.000Z'),
    });
  });

  it('links a Google Doc that is already active to the new source without a new document', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedConnection(workspaceId);
    drive.addFile(file({ id: 'google-doc-existing', name: 'Existing' }), '# Existing');
    drive.addFile(file({ id: 'google-doc-fresh', name: 'Fresh' }), '# Fresh');

    const initial = await createSource.execute(knowledgeCtx(workspaceId), {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      connectionId: publicKnowledgeConnectionId(testbed, connectionId),
      documents: [picked('google-doc-existing', 'Existing')],
    });
    const firstSourceId = testbed.ids.fromPublic(IdPrefix.KnowledgeSource, initial.source.id);

    const result = await createSource.execute(knowledgeCtx(workspaceId), {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      connectionId: publicKnowledgeConnectionId(testbed, connectionId),
      documents: [picked('google-doc-existing', 'Existing'), picked('google-doc-fresh', 'Fresh')],
    });

    expect(result.skipped).toEqual([
      { id: 'google-doc-existing', name: 'Existing', reason: 'already_added' },
    ]);
    expect(result.source).toMatchObject({ title: 'Google Docs (2)' });
    const sourceId = testbed.ids.fromPublic(IdPrefix.KnowledgeSource, result.source.id);
    const stored = await testbed.tenants.run(workspaceId, async () => ({
      sources: await sources.listByKnowledgeBase(workspaceId, knowledgeBaseId),
      documents: await documents.listBySource(workspaceId, sourceId),
      runs: await syncRuns.findLatestBySource(workspaceId, sourceId),
    }));
    expect(stored.sources).toHaveLength(2);
    expect(
      stored.documents
        .map((document) => document.externalId)
        .toSorted((left, right) => String(left).localeCompare(String(right))),
    ).toEqual(['google-doc-existing', 'google-doc-fresh']);
    expect(
      stored.documents.find((document) => document.externalId === 'google-doc-existing'),
    ).toMatchObject({ sourceId: firstSourceId });
    expect(stored.runs).toMatchObject({
      status: KnowledgeSyncStatus.Queued,
      documentsTotal: 1,
    });
  });

  it('creates a source that references every selected Google Doc already in the knowledge base', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedConnection(workspaceId);
    drive.addFile(file({ id: 'google-doc-existing', name: 'Existing' }), '# Existing');
    const input = {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
      connectionId: publicKnowledgeConnectionId(testbed, connectionId),
      documents: [picked('google-doc-existing', 'Existing')],
    };
    const initial = await createSource.execute(knowledgeCtx(workspaceId), input);
    const firstSourceId = testbed.ids.fromPublic(IdPrefix.KnowledgeSource, initial.source.id);
    const existingDocumentId = await testbed.tenants.run(workspaceId, async () => {
      const [existing] = await documents.listBySource(workspaceId, firstSourceId);
      if (existing === undefined) {
        throw new Error('the initial source has no document');
      }
      await documents.update(workspaceId, existing.id, {
        status: KnowledgeDocumentStatus.Indexed,
        activeGeneration: 1,
      });
      return existing.id;
    });

    const result = await createSource.execute(knowledgeCtx(workspaceId), input);

    expect(result.skipped).toEqual([
      { id: 'google-doc-existing', name: 'Existing', reason: 'already_added' },
    ]);
    expect(result.source).toMatchObject({
      title: 'Existing',
      status: KnowledgeSourceStatus.Ready,
      documentCount: 1,
      chunkCount: 0,
    });
    const secondSourceId = testbed.ids.fromPublic(IdPrefix.KnowledgeSource, result.source.id);
    const stored = await testbed.tenants.run(workspaceId, async () => ({
      sources: await sources.listByKnowledgeBase(workspaceId, knowledgeBaseId),
      documents: await documents.listBySource(workspaceId, secondSourceId),
      runs: await syncRuns.findLatestBySource(workspaceId, secondSourceId),
    }));
    expect(stored.sources).toHaveLength(2);
    expect(stored.documents.map((document) => document.id)).toEqual([existingDocumentId]);
    expect(stored.documents[0]).toMatchObject({ sourceId: firstSourceId });
    expect(stored.runs).toBeNull();
  });

  it('allows the same Google Doc in a different knowledge base', async () => {
    const workspaceId = testbed.ids.generate();
    const firstKnowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const secondKnowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId, {
      name: 'Second handbook',
      toolName: 'search_second_handbook',
    });
    const connectionId = await seedConnection(workspaceId);
    drive.addFile(file({ id: 'google-doc-shared', name: 'Shared' }), '# Shared');

    await createSource.execute(knowledgeCtx(workspaceId), {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, firstKnowledgeBaseId),
      connectionId: publicKnowledgeConnectionId(testbed, connectionId),
      documents: [picked('google-doc-shared', 'Shared')],
    });

    const result = await createSource.execute(knowledgeCtx(workspaceId), {
      knowledgeBaseId: publicKnowledgeBaseId(testbed, secondKnowledgeBaseId),
      connectionId: publicKnowledgeConnectionId(testbed, connectionId),
      documents: [picked('google-doc-shared', 'Shared')],
    });

    expect(result.skipped).toEqual([]);
    expect(result.source).toMatchObject({ title: 'Shared' });
  });

  it('fails when none of the selected documents can be read', async () => {
    const workspaceId = testbed.ids.generate();
    const knowledgeBaseId = await seedKnowledgeBase(testbed, workspaceId);
    const connectionId = await seedConnection(workspaceId);
    drive.setUnavailable('google-doc-missing');

    await expect(
      createSource.execute(knowledgeCtx(workspaceId), {
        knowledgeBaseId: publicKnowledgeBaseId(testbed, knowledgeBaseId),
        connectionId: publicKnowledgeConnectionId(testbed, connectionId),
        documents: [
          {
            id: 'google-doc-missing',
            name: 'Missing',
            mimeType: TEST_GOOGLE_DOC_MIME_TYPE,
            url: null,
            resourceKey: null,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(GoogleDocsSelectionInvalidError);
  });
});
