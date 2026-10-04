import {
  HEX_RADIX,
  ID_ALPHABET,
  ID_BITS_PER_CHARACTER,
  ID_CHARACTER_MASK,
  ID_ENCODED_LENGTH,
  UUID_GROUP_LENGTHS,
  UUID_GROUP_SEPARATOR,
  UUID_HEX_LENGTH,
} from '@/platform/ids/ids.constants';

export const encodeUuid = (uuid: string): string => {
  let value = BigInt(`0x${uuid.replaceAll(UUID_GROUP_SEPARATOR, '')}`);
  const characters: string[] = [];
  for (let index = 0; index < ID_ENCODED_LENGTH; index += 1) {
    characters.unshift(ID_ALPHABET.charAt(Number(value & ID_CHARACTER_MASK)));
    value >>= ID_BITS_PER_CHARACTER;
  }
  return characters.join('');
};

export const decodeUuid = (encoded: string): string => {
  const value = Array.from(encoded).reduce(
    (accumulator, character) =>
      (accumulator << ID_BITS_PER_CHARACTER) | BigInt(ID_ALPHABET.indexOf(character)),
    0n,
  );
  const hex = value.toString(HEX_RADIX).padStart(UUID_HEX_LENGTH, '0');
  const groups: string[] = [];
  let offset = 0;
  for (const length of UUID_GROUP_LENGTHS) {
    groups.push(hex.slice(offset, offset + length));
    offset += length;
  }
  return groups.join(UUID_GROUP_SEPARATOR);
};
