import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  GOOGLE_DRIVE_DOCUMENT_MIME_TYPE,
  GOOGLE_DRIVE_RESOURCE_KEY_HEADER,
} from '@/modules/knowledge/constants/google-drive.constants';
import {
  GoogleDriveExportTooLargeError,
  GoogleDriveFileUnavailableError,
} from '@/modules/knowledge/errors/google-drive.error';
import { GoogleDriveApiGateway } from '@/modules/knowledge/gateways/google-drive-api.gateway';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { FakeOutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.fake';
import {
  TEST_GOOGLE_ACCESS_TOKEN,
  TEST_GOOGLE_DOC_ID,
  TEST_GOOGLE_DOC_MARKDOWN,
  TEST_GOOGLE_DOC_MODIFIED_AT,
  TEST_GOOGLE_DOC_NAME,
  TEST_GOOGLE_DOC_URL,
  TEST_GOOGLE_DOC_VERSION,
} from '@test/support/constants/knowledge-testing.constants';

const FILE_RESPONSE = JSON.stringify({
  id: TEST_GOOGLE_DOC_ID,
  name: TEST_GOOGLE_DOC_NAME,
  mimeType: GOOGLE_DRIVE_DOCUMENT_MIME_TYPE,
  webViewLink: TEST_GOOGLE_DOC_URL,
  modifiedTime: TEST_GOOGLE_DOC_MODIFIED_AT,
  version: TEST_GOOGLE_DOC_VERSION,
  trashed: false,
});

describe('GoogleDriveApiGateway', () => {
  it('reads file metadata with the resource key header', async () => {
    const http = new FakeOutboundHttpGateway().respond(HttpStatus.OK, FILE_RESPONSE);
    const gateway = new GoogleDriveApiGateway(http);

    await expect(
      gateway.file(TEST_GOOGLE_ACCESS_TOKEN, TEST_GOOGLE_DOC_ID, 'resource-key'),
    ).resolves.toEqual({
      id: TEST_GOOGLE_DOC_ID,
      name: TEST_GOOGLE_DOC_NAME,
      mimeType: GOOGLE_DRIVE_DOCUMENT_MIME_TYPE,
      webViewLink: TEST_GOOGLE_DOC_URL,
      modifiedTime: TEST_GOOGLE_DOC_MODIFIED_AT,
      version: TEST_GOOGLE_DOC_VERSION,
      trashed: false,
    });
    const request = http.requests[0];
    if (request === undefined) {
      throw new Error('the gateway did not send a request');
    }
    expect(request.url).toContain('/files/google-doc-1?');
    expect(request.headers[HttpHeader.Authorization]).toBe(`Bearer ${TEST_GOOGLE_ACCESS_TOKEN}`);
    expect(request.headers[GOOGLE_DRIVE_RESOURCE_KEY_HEADER]).toBe('google-doc-1/resource-key');
  });

  it('exports Markdown', async () => {
    const http = new FakeOutboundHttpGateway().respond(HttpStatus.OK, TEST_GOOGLE_DOC_MARKDOWN);
    const gateway = new GoogleDriveApiGateway(http);

    await expect(
      gateway.exportMarkdown(TEST_GOOGLE_ACCESS_TOKEN, TEST_GOOGLE_DOC_ID, null),
    ).resolves.toBe(TEST_GOOGLE_DOC_MARKDOWN);
    const request = http.requests[0];
    if (request === undefined) {
      throw new Error('the gateway did not send a request');
    }
    expect(request.url).toContain('/files/google-doc-1/export?');
    expect(request.url).toContain('mimeType=text%2Fmarkdown');
  });

  it('reports an inaccessible file', async () => {
    const http = new FakeOutboundHttpGateway().respond(HttpStatus.NOT_FOUND, '{}');
    const gateway = new GoogleDriveApiGateway(http);

    await expect(
      gateway.file(TEST_GOOGLE_ACCESS_TOKEN, TEST_GOOGLE_DOC_ID, null),
    ).rejects.toBeInstanceOf(GoogleDriveFileUnavailableError);
  });

  it('reports an export that exceeds the document limit', async () => {
    const http = new FakeOutboundHttpGateway().respond(
      HttpStatus.OK,
      TEST_GOOGLE_DOC_MARKDOWN,
      true,
    );
    const gateway = new GoogleDriveApiGateway(http);

    await expect(
      gateway.exportMarkdown(TEST_GOOGLE_ACCESS_TOKEN, TEST_GOOGLE_DOC_ID, null),
    ).rejects.toBeInstanceOf(GoogleDriveExportTooLargeError);
  });
});
