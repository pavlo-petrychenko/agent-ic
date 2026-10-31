import { HttpStatus } from '@nestjs/common';
import { GoogleDriveFileUnavailableError } from '@/modules/knowledge/errors/google-drive.error';

export const googleDriveFileErrorForStatus = (status: number): Error | null =>
  status === HttpStatus.FORBIDDEN || status === HttpStatus.NOT_FOUND
    ? new GoogleDriveFileUnavailableError()
    : null;
