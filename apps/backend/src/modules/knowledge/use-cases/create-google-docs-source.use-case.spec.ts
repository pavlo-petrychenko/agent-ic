import { IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import { GoogleDocsSelectionInvalidError } from '@/modules/knowledge/errors/google-drive.error';
import { GoogleDriveGateway } from '@/modules/knowledge/gateways/google-drive.gateway';
import { GoogleOAuthGateway } from '@/modules/knowledge/gateways/google-oauth.gateway';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import type { GoogleDriveFile } from '@/modules/knowledge/typedefs/google-drive.typedefs';
import { CreateGoogleDocsSourceUseCase } from '@/modules/knowledge/use-cases/create-google-docs-source.use-case';
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

    expect(result.source).toMatchObject({
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
    const sourceId = testbed.ids.fromPublic(IdPrefix.KnowledgeSource, result.source.id);
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
