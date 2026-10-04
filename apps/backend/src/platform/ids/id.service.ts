import { Injectable } from '@nestjs/common';
import { v7 } from 'uuid';
import { Clock } from '@/platform/clock/clock';
import {
  ID_ENCODED_PATTERN,
  ID_PREFIX_PATTERN,
  ID_SEPARATOR,
  UUID_PATTERN,
} from '@/platform/ids/ids.constants';
import { decodeUuid, encodeUuid } from '@/platform/ids/ids.helpers';
import { InvalidIdPrefixError } from '@/platform/ids/invalid-id-prefix.error';
import { InvalidIdError } from '@/platform/ids/invalid-id.error';

@Injectable()
export class IdService {
  constructor(private readonly clock: Clock) {}

  generate(): string {
    return v7({ msecs: this.clock.now().getTime() });
  }

  toPublic(prefix: string, uuid: string): string {
    this.assertPrefix(prefix);
    if (!UUID_PATTERN.test(uuid)) {
      throw new InvalidIdError(prefix, uuid);
    }
    return `${prefix}${ID_SEPARATOR}${encodeUuid(uuid)}`;
  }

  fromPublic(prefix: string, publicId: string): string {
    this.assertPrefix(prefix);
    const expectedStart = `${prefix}${ID_SEPARATOR}`;
    const encoded = publicId.slice(expectedStart.length);
    if (!publicId.startsWith(expectedStart) || !ID_ENCODED_PATTERN.test(encoded)) {
      throw new InvalidIdError(prefix, publicId);
    }
    return decodeUuid(encoded);
  }

  private assertPrefix(prefix: string): void {
    if (!ID_PREFIX_PATTERN.test(prefix)) {
      throw new InvalidIdPrefixError(prefix);
    }
  }
}
