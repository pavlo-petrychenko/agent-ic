import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@/platform/config/services/config.service';
import type { SecretBoxKey } from '@/platform/config/typedefs/app-config.typedefs';
import {
  SECRET_BOX_ALGORITHM,
  SECRET_BOX_AUTH_TAG_BYTES,
  SECRET_BOX_IV_BYTES,
  SECRET_BOX_KEY_ENCODING,
  SECRET_BOX_PLAINTEXT_ENCODING,
} from '@/platform/secrets/constants/secret-box.constants';
import { SecretKeyVersionUnknownError } from '@/platform/secrets/errors/secret-key-version-unknown.error';
import { SecretTamperedError } from '@/platform/secrets/errors/secret-tampered.error';
import {
  formatSealedSecret,
  parseSealedSecret,
} from '@/platform/secrets/helpers/secret-box.helpers';

@Injectable()
export class SecretBoxService {
  private readonly currentVersion: number;
  private readonly keys: ReadonlyMap<number, Buffer>;

  constructor(config: ConfigService) {
    const { current, previous } = config.config.secretBox;
    this.currentVersion = current.version;
    this.keys = new Map(
      [current, ...previous].map((entry: SecretBoxKey) => [
        entry.version,
        Buffer.from(entry.key, SECRET_BOX_KEY_ENCODING),
      ]),
    );
  }

  seal(plaintext: string): string {
    const iv = randomBytes(SECRET_BOX_IV_BYTES);
    const cipher = createCipheriv(SECRET_BOX_ALGORITHM, this.keyFor(this.currentVersion), iv, {
      authTagLength: SECRET_BOX_AUTH_TAG_BYTES,
    });
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, SECRET_BOX_PLAINTEXT_ENCODING),
      cipher.final(),
    ]);
    return formatSealedSecret({
      version: this.currentVersion,
      iv,
      authTag: cipher.getAuthTag(),
      ciphertext,
    });
  }

  open(sealed: string): string {
    const parsed = parseSealedSecret(sealed);
    if (parsed === null) {
      throw new SecretTamperedError();
    }
    const decipher = createDecipheriv(
      SECRET_BOX_ALGORITHM,
      this.keyFor(parsed.version),
      parsed.iv,
      {
        authTagLength: SECRET_BOX_AUTH_TAG_BYTES,
      },
    );
    decipher.setAuthTag(parsed.authTag);
    try {
      return Buffer.concat([decipher.update(parsed.ciphertext), decipher.final()]).toString(
        SECRET_BOX_PLAINTEXT_ENCODING,
      );
    } catch (error) {
      throw new SecretTamperedError(error);
    }
  }

  private keyFor(version: number): Buffer {
    const key = this.keys.get(version);
    if (key === undefined) {
      throw new SecretKeyVersionUnknownError(version);
    }
    return key;
  }
}
