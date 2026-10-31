import type { GoogleDriveFile } from '@/modules/knowledge/typedefs/google-drive.typedefs';

export abstract class GoogleDriveGateway {
  abstract file(
    accessToken: string,
    fileId: string,
    resourceKey: string | null,
  ): Promise<GoogleDriveFile>;

  abstract exportMarkdown(
    accessToken: string,
    fileId: string,
    resourceKey: string | null,
  ): Promise<string>;
}
