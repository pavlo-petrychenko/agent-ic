import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { WorkspacesRepository } from '@/modules/identity';
import {
  GOOGLE_DRIVE_DOCUMENT_MIME_TYPE,
  GooglePickerSkipReason,
} from '@/modules/knowledge/constants/google-drive.constants';
import {
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import {
  GoogleDocsSelectionInvalidError,
  GoogleDriveFileRemovedError,
  GoogleDriveFileUnavailableError,
} from '@/modules/knowledge/errors/google-drive.error';
import { KnowledgeBaseNotFoundError } from '@/modules/knowledge/errors/knowledge-base-not-found.error';
import { KnowledgeConnectionNotFoundError } from '@/modules/knowledge/errors/knowledge-connection-not-found.error';
import { GoogleDriveGateway } from '@/modules/knowledge/gateways/google-drive.gateway';
import {
  googleDocsDocumentTitle,
  googleDocsSourceTitleFromNames,
  googleDriveDate,
} from '@/modules/knowledge/helpers/google-picker.helpers';
import { parseKnowledgeInput } from '@/modules/knowledge/helpers/knowledge-input.helpers';
import { sourceScheduleFields } from '@/modules/knowledge/helpers/knowledge-schedule.helpers';
import { knowledgeSourceStateForDocuments } from '@/modules/knowledge/helpers/knowledge-source-state.helpers';
import { ingestKnowledgeSourceJob } from '@/modules/knowledge/jobs/ingest-knowledge-source.job';
import { ConnectionsRepository } from '@/modules/knowledge/repositories/connections.repository';
import { DocumentsRepository } from '@/modules/knowledge/repositories/documents.repository';
import { KnowledgeBasesRepository } from '@/modules/knowledge/repositories/knowledge-bases.repository';
import { KnowledgeStatsRepository } from '@/modules/knowledge/repositories/knowledge-stats.repository';
import { SourceDocumentsRepository } from '@/modules/knowledge/repositories/source-documents.repository';
import { SourcesRepository } from '@/modules/knowledge/repositories/sources.repository';
import { SyncRunsRepository } from '@/modules/knowledge/repositories/sync-runs.repository';
import { createGoogleDocsSourceInputSchema } from '@/modules/knowledge/schemas/google-picker.schema';
import { GoogleConnectionTokenService } from '@/modules/knowledge/services/google-connection-token.service';
import { KnowledgeSourceViewsService } from '@/modules/knowledge/services/knowledge-source-views.service';
import type { Connection } from '@/modules/knowledge/typedefs/connection.typedefs';
import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';
import type { GoogleDriveFile } from '@/modules/knowledge/typedefs/google-drive.typedefs';
import type {
  CreateGoogleDocsSourceInput,
  CreateGoogleDocsSourceResult,
  GooglePickedDocument,
  GooglePickerSkippedDocument,
} from '@/modules/knowledge/typedefs/google-picker.typedefs';
import type { KnowledgeBase } from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import type {
  KnowledgeScheduleInput,
  SourceScheduleFields,
} from '@/modules/knowledge/typedefs/source-schedule.typedefs';
import type { Source } from '@/modules/knowledge/typedefs/source.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { JobsService } from '@/platform/queues/services/jobs.service';

interface PreparedDocument {
  readonly documentId: string;
  readonly picked: GooglePickedDocument;
  readonly file: GoogleDriveFile;
}

interface PreparedSelection {
  readonly prepared: readonly PreparedDocument[];
  readonly referenced: readonly Document[];
  readonly skipped: readonly GooglePickerSkippedDocument[];
}

interface CreateSourceInput {
  readonly workspaceId: string;
  readonly userId: string;
  readonly knowledgeBaseId: string;
  readonly connection: Connection;
  readonly prepared: readonly PreparedDocument[];
  readonly scheduleInput: KnowledgeScheduleInput;
}

interface CreatedSource {
  readonly source: Source;
  readonly skipped: readonly GooglePickerSkippedDocument[];
}

@Injectable()
export class CreateGoogleDocsSourceUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly knowledgeBases: KnowledgeBasesRepository,
    private readonly connections: ConnectionsRepository,
    private readonly sources: SourcesRepository,
    private readonly sourceDocuments: SourceDocumentsRepository,
    private readonly documents: DocumentsRepository,
    private readonly stats: KnowledgeStatsRepository,
    private readonly syncRuns: SyncRunsRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly views: KnowledgeSourceViewsService,
    private readonly jobs: JobsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
    private readonly tokens: GoogleConnectionTokenService,
    private readonly drive: GoogleDriveGateway,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: CreateGoogleDocsSourceInput,
  ): Promise<CreateGoogleDocsSourceResult> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.KnowledgeBases,
      PermissionAction.Edit,
    );
    const parsed = parseKnowledgeInput(createGoogleDocsSourceInputSchema, input);
    const knowledgeBaseId = this.ids.fromPublic(IdPrefix.KnowledgeBase, parsed.knowledgeBaseId);
    const connectionId = this.ids.fromPublic(IdPrefix.KnowledgeConnection, parsed.connectionId);
    const connection = await this.loadConnection(workspaceId, connectionId);
    const token = await this.tokens.accessToken(connection);
    const { prepared, skipped } = await this.prepareDocuments(token.accessToken, parsed.documents);
    if (prepared.length === 0) {
      throw new GoogleDocsSelectionInvalidError();
    }
    const created = await this.createSource(ctx, {
      workspaceId,
      userId,
      knowledgeBaseId,
      connection,
      prepared,
      scheduleInput: parsed,
    });
    return {
      source: this.views.view(created.source),
      skipped: [...skipped, ...created.skipped],
    };
  }

  private async loadConnection(workspaceId: string, connectionId: string): Promise<Connection> {
    const connection = await this.tenants.run(workspaceId, () =>
      this.connections.findById(workspaceId, connectionId),
    );
    if (connection === null) {
      throw new KnowledgeConnectionNotFoundError();
    }
    return connection;
  }

  private async prepareDocuments(
    accessToken: string,
    pickedDocuments: readonly GooglePickedDocument[],
  ): Promise<PreparedSelection> {
    const prepared: PreparedDocument[] = [];
    const skipped: GooglePickerSkippedDocument[] = [];
    for (const picked of pickedDocuments) {
      const file = await this.loadDriveFile(accessToken, picked);
      if (file === null) {
        skipped.push(this.skip(picked, GooglePickerSkipReason.Unavailable));
        continue;
      }
      const reason = this.fileSkipReason(file);
      if (reason !== null) {
        skipped.push(this.skip(picked, reason));
        continue;
      }
      prepared.push({ documentId: this.ids.generate(), picked, file });
    }
    return { prepared, referenced: [], skipped };
  }

  private async loadDriveFile(
    accessToken: string,
    picked: GooglePickedDocument,
  ): Promise<GoogleDriveFile | null> {
    try {
      return await this.drive.file(accessToken, picked.id, picked.resourceKey);
    } catch (error) {
      if (
        error instanceof GoogleDriveFileUnavailableError ||
        error instanceof GoogleDriveFileRemovedError
      ) {
        return null;
      }
      throw error;
    }
  }

  private fileSkipReason(file: GoogleDriveFile): GooglePickerSkipReason | null {
    if (file.trashed) {
      return GooglePickerSkipReason.Trashed;
    }
    if (file.mimeType !== GOOGLE_DRIVE_DOCUMENT_MIME_TYPE) {
      return GooglePickerSkipReason.Unsupported;
    }
    return null;
  }

  private async createSource(ctx: UseCaseCtx, input: CreateSourceInput): Promise<CreatedSource> {
    const { workspaceId, userId, knowledgeBaseId, connection, prepared, scheduleInput } = input;
    return this.tenants.run(workspaceId, async () => {
      const knowledgeBase = await this.lockKnowledgeBase(workspaceId, knowledgeBaseId);
      const schedule = await this.scheduleFor(workspaceId, scheduleInput);
      const selection = await this.resolveSelection(workspaceId, knowledgeBase.id, prepared);
      const source = await this.insertSource(
        workspaceId,
        userId,
        knowledgeBase,
        connection,
        selection.prepared,
        selection.referenced,
        schedule,
      );
      await this.insertDocuments(workspaceId, knowledgeBase.id, source.id, selection.prepared);
      await this.sourceDocuments.insertMany(workspaceId, knowledgeBase.id, source.id, [
        ...selection.prepared.map((document) => document.documentId),
        ...selection.referenced.map((document) => document.id),
      ]);
      const linkedDocuments = await this.documents.listBySource(workspaceId, source.id);
      const state = knowledgeSourceStateForDocuments(linkedDocuments);
      const counts = await this.stats.sourceCounts(workspaceId, source.id);
      const updated = await this.sources.update(workspaceId, source.id, {
        status: state.status,
        lastErrorCode: state.lastErrorCode,
        lastErrorMessage: state.lastErrorMessage,
        ...counts,
      });
      if (selection.prepared.length > 0) {
        await this.queueInitialSync(ctx, workspaceId, source.id, selection.prepared.length);
      }
      await this.connections.update(workspaceId, connection.id, {
        lastUsedAt: this.clock.now(),
      });
      return { source: updated ?? source, skipped: selection.skipped };
    });
  }

  private async resolveSelection(
    workspaceId: string,
    knowledgeBaseId: string,
    prepared: readonly PreparedDocument[],
  ): Promise<PreparedSelection> {
    const existingDocuments = await this.documents.listActiveByExternalIds(
      workspaceId,
      knowledgeBaseId,
      prepared.map((document) => document.file.id),
    );
    const existingByExternalId = new Map<string, Document>();
    for (const document of existingDocuments) {
      if (document.externalId !== null) {
        existingByExternalId.set(document.externalId, document);
      }
    }
    const fresh: PreparedDocument[] = [];
    const referenced: Document[] = [];
    const skipped: GooglePickerSkippedDocument[] = [];
    const seen = new Set<string>();
    for (const document of prepared) {
      if (seen.has(document.file.id)) {
        skipped.push(this.skip(document.picked, GooglePickerSkipReason.AlreadyAdded));
        continue;
      }
      seen.add(document.file.id);
      const existing = existingByExternalId.get(document.file.id);
      if (existing === undefined) {
        fresh.push(document);
        continue;
      }
      referenced.push(existing);
      skipped.push(this.skip(document.picked, GooglePickerSkipReason.AlreadyAdded));
    }
    return { prepared: fresh, referenced, skipped };
  }

  private async lockKnowledgeBase(
    workspaceId: string,
    knowledgeBaseId: string,
  ): Promise<KnowledgeBase> {
    const knowledgeBase = await this.knowledgeBases.findByIdForUpdate(workspaceId, knowledgeBaseId);
    if (knowledgeBase === null) {
      throw new KnowledgeBaseNotFoundError();
    }
    return knowledgeBase;
  }

  private async scheduleFor(
    workspaceId: string,
    input: KnowledgeScheduleInput,
  ): Promise<SourceScheduleFields> {
    const workspace = await this.workspaces.findById(workspaceId);
    if (workspace === null) {
      throw new WorkspaceAccessDeniedError();
    }
    return sourceScheduleFields(input, workspace.timeZone, this.clock.now());
  }

  private async insertSource(
    workspaceId: string,
    userId: string,
    knowledgeBase: KnowledgeBase,
    connection: Connection,
    prepared: readonly PreparedDocument[],
    referenced: readonly Document[],
    schedule: SourceScheduleFields,
  ): Promise<Source> {
    return this.sources.insert({
      id: this.ids.generate(),
      workspaceId,
      kbId: knowledgeBase.id,
      connectionId: connection.id,
      kind: KnowledgeSourceKind.GoogleDocs,
      title: googleDocsSourceTitleFromNames([
        ...prepared.map((document) => document.file.name),
        ...referenced.map((document) => document.title),
      ]),
      status: KnowledgeSourceStatus.Pending,
      createdByUserId: userId,
      ...schedule,
    });
  }

  private async insertDocuments(
    workspaceId: string,
    knowledgeBaseId: string,
    sourceId: string,
    prepared: readonly PreparedDocument[],
  ): Promise<void> {
    for (const document of prepared) {
      await this.documents.insert({
        id: document.documentId,
        workspaceId,
        kbId: knowledgeBaseId,
        sourceId,
        externalId: document.file.id,
        externalResourceKey: document.picked.resourceKey,
        providerVersion: document.file.version,
        providerModifiedAt: googleDriveDate(document.file.modifiedTime),
        title: googleDocsDocumentTitle(document.file),
        mimeType: document.file.mimeType,
        sourceUrl: document.file.webViewLink ?? document.picked.url,
        status: KnowledgeDocumentStatus.Pending,
      });
    }
  }

  private async queueInitialSync(
    ctx: UseCaseCtx,
    workspaceId: string,
    sourceId: string,
    documentsTotal: number,
  ): Promise<void> {
    const syncRunId = this.ids.generate();
    await this.syncRuns.insert({
      id: syncRunId,
      workspaceId,
      sourceId,
      trigger: KnowledgeSyncTrigger.Initial,
      status: KnowledgeSyncStatus.Queued,
      documentsTotal,
    });
    await this.jobs.enqueue(
      ctx,
      ingestKnowledgeSourceJob,
      { sourceId, syncRunId },
      { durable: true, jobId: syncRunId },
    );
  }

  private skip(
    picked: GooglePickedDocument,
    reason: GooglePickerSkipReason,
  ): GooglePickerSkippedDocument {
    return { id: picked.id, name: picked.name, reason };
  }
}
