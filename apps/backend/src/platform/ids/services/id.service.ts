import { Injectable } from '@nestjs/common';
import { v7 } from 'uuid';
import { ClockService } from '@/platform/clock/services/clock.service';
import {
  ID_ENCODED_PATTERN,
  ID_PREFIX_PATTERN,
  ID_SEPARATOR,
  UUID_PATTERN,
} from '@/platform/ids/constants/ids.constants';
import { InvalidIdPrefixError } from '@/platform/ids/errors/invalid-id-prefix.error';
import { InvalidIdError } from '@/platform/ids/errors/invalid-id.error';
import { decodeUuid, encodeUuid } from '@/platform/ids/helpers/id-encoding.helpers';

@Injectable()
export class IdService {
  constructor(private readonly clock: ClockService) {}

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
