import {
  SEALED_PART_COUNT,
  SEALED_PART_ENCODING,
  SEALED_PART_PATTERN,
  SEALED_PART_SEPARATOR,
  SEALED_VERSION_PATTERN,
  SEALED_VERSION_PREFIX,
  SECRET_BOX_AUTH_TAG_BYTES,
  SECRET_BOX_IV_BYTES,
} from '@/platform/secrets/constants/secret-box.constants';
import type { SealedSecret } from '@/platform/secrets/typedefs/secret-box.typedefs';

export const formatSealedSecret = (sealed: SealedSecret): string =>
  [
    `${SEALED_VERSION_PREFIX}${sealed.version}`,
    sealed.iv.toString(SEALED_PART_ENCODING),
    sealed.authTag.toString(SEALED_PART_ENCODING),
    sealed.ciphertext.toString(SEALED_PART_ENCODING),
  ].join(SEALED_PART_SEPARATOR);

export const parseSealedSecret = (value: string): SealedSecret | null => {
  const parts = value.split(SEALED_PART_SEPARATOR);
  const [version, iv, authTag, ciphertext] = parts;
  const versionMatch = SEALED_VERSION_PATTERN.exec(version ?? '');
  if (
    parts.length !== SEALED_PART_COUNT ||
    versionMatch?.[1] === undefined ||
    iv === undefined ||
    authTag === undefined ||
    ciphertext === undefined ||
    ![iv, authTag, ciphertext].every((part) => SEALED_PART_PATTERN.test(part))
  ) {
    return null;
  }
  const sealed: SealedSecret = {
    version: Number(versionMatch[1]),
    iv: Buffer.from(iv, SEALED_PART_ENCODING),
    authTag: Buffer.from(authTag, SEALED_PART_ENCODING),
    ciphertext: Buffer.from(ciphertext, SEALED_PART_ENCODING),
  };
  return sealed.iv.length === SECRET_BOX_IV_BYTES &&
    sealed.authTag.length === SECRET_BOX_AUTH_TAG_BYTES
    ? sealed
    : null;
};
