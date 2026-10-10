import { Global, Module } from '@nestjs/common';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';

@Global()
@Module({
  providers: [SecretBoxService],
  exports: [SecretBoxService],
})
export class SecretsModule {}
