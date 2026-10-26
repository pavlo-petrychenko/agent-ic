import { Global, Module } from '@nestjs/common';
import { FileStorage } from '@/platform/storage/gateways/file-storage.gateway';
import { S3FileStorageGateway } from '@/platform/storage/gateways/s3-file-storage.gateway';

@Global()
@Module({
  providers: [{ provide: FileStorage, useClass: S3FileStorageGateway }],
  exports: [FileStorage],
})
export class StorageModule {}
