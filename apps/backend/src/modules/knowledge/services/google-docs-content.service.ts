import { KNOWLEDGE_DOCUMENT_MAX_BYTES } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { GOOGLE_DRIVE_DOCUMENT_MIME_TYPE } from '@/modules/knowledge/constants/google-drive.constants';
import { KNOWLEDGE_CANONICAL_MARKDOWN_MIME_TYPE } from '@/modules/knowledge/constants/knowledge-storage.constants';
import { KnowledgeDocumentStaleReason } from '@/modules/knowledge/constants/knowledge.constants';
import {
  GoogleDriveExportTooLargeError,
  GoogleDriveFileRemovedError,
  GoogleDriveFileUnavailableError,
} from '@/modules/knowledge/errors/google-drive.error';
import { GoogleDriveGateway } from '@/modules/knowledge/gateways/google-drive.gateway';
import { googleDriveVersion } from '@/modules/knowledge/helpers/google-picker.helpers';
import { knowledgeOriginalStorageKey } from '@/modules/knowledge/helpers/knowledge-storage.helpers';
import { GoogleConnectionTokenService } from '@/modules/knowledge/services/google-connection-token.service';
import type {
  ExportGoogleDocsContentInput,
  ExportGoogleDocsInput,
  GoogleDocsContent,
  GoogleDocsFileSnapshot,
} from '@/modules/knowledge/typedefs/google-docs-content.typedefs';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';

@Injectable()
export class GoogleDocsContentService {
  constructor(
    private readonly tokens: GoogleConnectionTokenService,
    private readonly drive: GoogleDriveGateway,
    private readonly storage: FileStorage,
  ) {}

  async inspect({ document, connection }: ExportGoogleDocsInput): Promise<GoogleDocsFileSnapshot> {
    if (document.externalId === null) {
      throw new GoogleDriveFileUnavailableError();
    }
    const accessToken = await this.tokens.accessToken(connection);
    const file = await this.drive.file(
      accessToken.accessToken,
      document.externalId,
      document.externalResourceKey,
    );
    if (file.trashed) {
      throw new GoogleDriveFileRemovedError(KnowledgeDocumentStaleReason.Trashed);
    }
    if (file.mimeType !== GOOGLE_DRIVE_DOCUMENT_MIME_TYPE) {
      throw new GoogleDriveFileUnavailableError();
    }
    return { file, accessToken };
  }

  async export({
    workspaceId,
    document,
    snapshot,
  }: ExportGoogleDocsContentInput): Promise<GoogleDocsContent> {
    const markdown = await this.drive.exportMarkdown(
      snapshot.accessToken.accessToken,
      snapshot.file.id,
      document.externalResourceKey,
    );
    const bytes = Buffer.from(markdown);
    if (bytes.length > KNOWLEDGE_DOCUMENT_MAX_BYTES) {
      throw new GoogleDriveExportTooLargeError();
    }
    const fileName = `${snapshot.file.name}.md`;
    const storageKey = knowledgeOriginalStorageKey(
      workspaceId,
      document.id,
      googleDriveVersion(snapshot.file),
      fileName,
    );
    await this.storage.put(storageKey, bytes, KNOWLEDGE_CANONICAL_MARKDOWN_MIME_TYPE);
    return {
      storageKey,
      fileName,
      mimeType: KNOWLEDGE_CANONICAL_MARKDOWN_MIME_TYPE,
      bytes,
      file: snapshot.file,
    };
  }
}
