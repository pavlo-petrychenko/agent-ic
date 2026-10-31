import {
  GoogleDriveExportTooLargeError,
  GoogleDriveFileUnavailableError,
} from '@/modules/knowledge/errors/google-drive.error';
import { GoogleDriveGateway } from '@/modules/knowledge/gateways/google-drive.gateway';
import type { GoogleDriveFile } from '@/modules/knowledge/typedefs/google-drive.typedefs';

export class FakeGoogleDriveGateway extends GoogleDriveGateway {
  private readonly files = new Map<string, GoogleDriveFile>();
  private readonly markdown = new Map<string, string>();
  private readonly unavailable = new Set<string>();
  private readonly tooLarge = new Set<string>();
  readonly exportRequests: string[] = [];

  addFile(file: GoogleDriveFile, markdown: string): void {
    this.files.set(file.id, file);
    this.markdown.set(file.id, markdown);
  }

  setUnavailable(fileId: string): void {
    this.unavailable.add(fileId);
  }

  setTooLarge(fileId: string): void {
    this.tooLarge.add(fileId);
  }

  async file(
    _accessToken: string,
    fileId: string,
    _resourceKey: string | null,
  ): Promise<GoogleDriveFile> {
    if (this.unavailable.has(fileId)) {
      throw new GoogleDriveFileUnavailableError();
    }
    const file = this.files.get(fileId);
    if (file === undefined) {
      throw new GoogleDriveFileUnavailableError();
    }
    return file;
  }

  async exportMarkdown(
    _accessToken: string,
    fileId: string,
    _resourceKey: string | null,
  ): Promise<string> {
    this.exportRequests.push(fileId);
    if (this.tooLarge.has(fileId)) {
      throw new GoogleDriveExportTooLargeError();
    }
    const markdown = this.markdown.get(fileId);
    if (markdown === undefined) {
      throw new GoogleDriveFileUnavailableError();
    }
    return markdown;
  }
}
