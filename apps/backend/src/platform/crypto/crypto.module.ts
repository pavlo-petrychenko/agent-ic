import { Global, Module } from '@nestjs/common';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';

@Global()
@Module({
  providers: [SecureTokenService],
  exports: [SecureTokenService],
})
export class CryptoModule {}
