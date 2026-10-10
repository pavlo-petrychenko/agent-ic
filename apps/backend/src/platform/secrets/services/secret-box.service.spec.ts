import { describe, expect, it } from 'vitest';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import {
  SEALED_PART_ENCODING,
  SEALED_PART_SEPARATOR,
} from '@/platform/secrets/constants/secret-box.constants';
import { SecretKeyVersionUnknownError } from '@/platform/secrets/errors/secret-key-version-unknown.error';
import { SecretTamperedError } from '@/platform/secrets/errors/secret-tampered.error';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';
import { TEST_ENV } from '@test/support/constants/test-env.constants';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

const PLAINTEXT = 'bot-token: 123456:ABC-déjà-vu';
const NEXT_KEY = 'f'.repeat(64);
const IV_BYTES = 12;

const createBox = (overrides: Partial<Record<EnvVar, string>> = {}): SecretBoxService =>
  new SecretBoxService(
    new ConfigService(loadAppConfig({ role: Role.Api, queues: [] }, createTestEnv(overrides))),
  );

const rotatedBox = (): SecretBoxService =>
  createBox({
    [EnvVar.SecretBoxKey]: NEXT_KEY,
    [EnvVar.SecretBoxKeyVersion]: '2',
    [EnvVar.SecretBoxPreviousKeys]: `1:${TEST_ENV[EnvVar.SecretBoxKey]}`,
  });

const flipBit = (sealed: string, partIndex: number): string => {
  const parts = sealed.split(SEALED_PART_SEPARATOR);
  const bytes = Buffer.from(parts[partIndex] ?? '', SEALED_PART_ENCODING);
  bytes.writeUInt8(bytes.readUInt8(0) ^ 1, 0);
  parts[partIndex] = bytes.toString(SEALED_PART_ENCODING);
  return parts.join(SEALED_PART_SEPARATOR);
};

describe('SecretBoxService', () => {
  it('opens what it sealed', () => {
    const box = createBox();

    expect(box.open(box.seal(PLAINTEXT))).toBe(PLAINTEXT);
  });

  it('seals with a fresh 12-byte iv every time and never shows the plaintext', () => {
    const box = createBox();

    const first = box.seal(PLAINTEXT);
    const second = box.seal(PLAINTEXT);

    expect(first).not.toBe(second);
    expect(first).not.toContain(PLAINTEXT);
    const iv = first.split(SEALED_PART_SEPARATOR)[1] ?? '';
    expect(Buffer.from(iv, SEALED_PART_ENCODING)).toHaveLength(IV_BYTES);
  });

  it('puts the current key version into the sealed string', () => {
    expect(createBox().seal(PLAINTEXT)).toMatch(/^v1\./);
    expect(rotatedBox().seal(PLAINTEXT)).toMatch(/^v2\./);
  });

  it('still opens a value sealed with a previous key after a rotation', () => {
    const sealedBefore = createBox().seal(PLAINTEXT);

    expect(rotatedBox().open(sealedBefore)).toBe(PLAINTEXT);
  });

  it.each([1, 2, 3])('fails when a bit of part %i is flipped', (partIndex) => {
    const box = createBox();
    const tampered = flipBit(box.seal(PLAINTEXT), partIndex);

    expect(() => box.open(tampered)).toThrow(SecretTamperedError);
  });

  it.each(['', 'not-sealed', 'v1.a.b', 'v1.a.b.c.d', 'x1.AAAA.AAAA.AAAA', 'v1.!!!.AAAA.AAAA'])(
    'fails on a malformed sealed string: %s',
    (sealed) => {
      expect(() => createBox().open(sealed)).toThrow(SecretTamperedError);
    },
  );

  it('fails when the value was sealed with a key version it does not know', () => {
    const sealedLater = rotatedBox().seal(PLAINTEXT);

    expect(() => createBox().open(sealedLater)).toThrow(SecretKeyVersionUnknownError);
  });
});
