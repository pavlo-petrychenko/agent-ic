import { KNOWLEDGE_DOCUMENT_MAX_BYTES } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  GOOGLE_DRIVE_API_BASE,
  GOOGLE_DRIVE_EXPORT_MIME_TYPE,
  GOOGLE_DRIVE_FILES_PATH,
  GOOGLE_DRIVE_FILE_FIELDS,
  GOOGLE_DRIVE_RESOURCE_KEY_HEADER,
  GOOGLE_DRIVE_TIMEOUT_MS,
} from '@/modules/knowledge/constants/google-drive.constants';
import { GoogleDriveExportTooLargeError } from '@/modules/knowledge/errors/google-drive.error';
import { GoogleDriveGateway } from '@/modules/knowledge/gateways/google-drive.gateway';
import { googleDriveFileErrorForStatus } from '@/modules/knowledge/helpers/google-drive.helpers';
import { googleHttpRequest, googleJson } from '@/modules/knowledge/helpers/google-http.helpers';
import { googleDriveFileSchema } from '@/modules/knowledge/schemas/google-drive.schema';
import type { GoogleDriveFile } from '@/modules/knowledge/typedefs/google-drive.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';

@Injectable()
export class GoogleDriveApiGateway extends GoogleDriveGateway {
  constructor(private readonly http: OutboundHttpGateway) {
    super();
  }

  async file(
    accessToken: string,
    fileId: string,
    resourceKey: string | null,
  ): Promise<GoogleDriveFile> {
    const parameters = new URLSearchParams({
      fields: GOOGLE_DRIVE_FILE_FIELDS,
      supportsAllDrives: 'true',
    });
    const result = await googleHttpRequest(
      this.http,
      {
        method: 'GET',
        url: `${GOOGLE_DRIVE_API_BASE}/${GOOGLE_DRIVE_FILES_PATH}/${encodeURIComponent(fileId)}?${parameters.toString()}`,
        headers: this.headers(accessToken, fileId, resourceKey),
        body: null,
        timeoutMs: GOOGLE_DRIVE_TIMEOUT_MS,
      },
      { onStatus: googleDriveFileErrorForStatus },
    );
    const parsed = googleJson(result, googleDriveFileSchema);
    return {
      id: parsed.id,
      name: parsed.name,
      mimeType: parsed.mimeType,
      webViewLink: parsed.webViewLink ?? null,
      modifiedTime: parsed.modifiedTime ?? null,
      version: parsed.version ?? null,
      trashed: parsed.trashed ?? false,
    };
  }

  async exportMarkdown(
    accessToken: string,
    fileId: string,
    resourceKey: string | null,
  ): Promise<string> {
    const parameters = new URLSearchParams({ mimeType: GOOGLE_DRIVE_EXPORT_MIME_TYPE });
    const result = await googleHttpRequest(
      this.http,
      {
        method: 'GET',
        url: `${GOOGLE_DRIVE_API_BASE}/${GOOGLE_DRIVE_FILES_PATH}/${encodeURIComponent(fileId)}/export?${parameters.toString()}`,
        headers: this.headers(accessToken, fileId, resourceKey),
        body: null,
        timeoutMs: GOOGLE_DRIVE_TIMEOUT_MS,
        maxBodyBytes: KNOWLEDGE_DOCUMENT_MAX_BYTES,
      },
      {
        onStatus: googleDriveFileErrorForStatus,
        onTruncated: () => new GoogleDriveExportTooLargeError(),
      },
    );
    return result.body ?? '';
  }

  private headers(
    accessToken: string,
    fileId: string,
    resourceKey: string | null,
  ): Readonly<Record<string, string>> {
    return {
      [HttpHeader.Authorization]: `Bearer ${accessToken}`,
      ...(resourceKey === null
        ? {}
        : { [GOOGLE_DRIVE_RESOURCE_KEY_HEADER]: `${fileId}/${resourceKey}` }),
    };
  }
}
