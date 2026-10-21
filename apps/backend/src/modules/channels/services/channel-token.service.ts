import { Injectable } from '@nestjs/common';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';

@Injectable()
export class ChannelTokenService {
  constructor(private readonly secrets: SecretBoxService) {}

  seal(token: string): string {
    return this.secrets.seal(token);
  }

  open(sealed: string): string {
    return this.secrets.open(sealed);
  }
}
