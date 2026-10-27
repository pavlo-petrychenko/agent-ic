import { Injectable } from '@nestjs/common';
import type { ChannelCredentials } from '@/modules/channels/typedefs/channel-identity.typedefs';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';

@Injectable()
export class ChannelTokenService {
  constructor(private readonly secrets: SecretBoxService) {}

  sealCredentials(credentials: ChannelCredentials): string {
    return this.secrets.seal(JSON.stringify(credentials));
  }

  openCredentials(sealed: string): ChannelCredentials {
    return JSON.parse(this.secrets.open(sealed)) as ChannelCredentials;
  }
}
