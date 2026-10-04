import { describe, expect, it } from 'vitest';
import { IdService } from '@/platform/ids/id.service';
import { ID_ENCODED_LENGTH, ID_SEPARATOR, UUID_PATTERN } from '@/platform/ids/ids.constants';
import { InvalidIdPrefixError } from '@/platform/ids/invalid-id-prefix.error';
import { InvalidIdError } from '@/platform/ids/invalid-id.error';
import { ManualClock } from '@/platform/testing/manual.clock';

const PREFIX = 'agt';
const OTHER_PREFIX = 'kb';
const START = new Date('2026-10-04T12:00:00.000Z');
const UUID_VERSION_INDEX = 14;
const UUID_VERSION_SEVEN = '7';

const createIds = (): { ids: IdService; clock: ManualClock } => {
  const clock = new ManualClock(START);
  return { ids: new IdService(clock), clock };
};

describe('IdService', () => {
  it('generates version 7 uuids', () => {
    const { ids } = createIds();

    const uuid = ids.generate();

    expect(uuid).toMatch(UUID_PATTERN);
    expect(uuid.charAt(UUID_VERSION_INDEX)).toBe(UUID_VERSION_SEVEN);
  });

  it('generates ids that sort by the clock time', () => {
    const { ids, clock } = createIds();

    const first = ids.generate();
    clock.advanceBy(1);
    const second = ids.generate();

    expect([second, first].toSorted()).toEqual([first, second]);
  });

  it('exposes a uuid with its prefix', () => {
    const { ids } = createIds();

    const publicId = ids.toPublic(PREFIX, ids.generate());

    expect(publicId.startsWith(`${PREFIX}${ID_SEPARATOR}`)).toBe(true);
    expect(publicId).toHaveLength(PREFIX.length + ID_SEPARATOR.length + ID_ENCODED_LENGTH);
  });

  it('reads back the uuid from a public id', () => {
    const { ids } = createIds();
    const uuid = ids.generate();

    expect(ids.fromPublic(PREFIX, ids.toPublic(PREFIX, uuid))).toBe(uuid);
  });

  it('keeps the order of uuids in public ids', () => {
    const { ids, clock } = createIds();
    const first = ids.toPublic(PREFIX, ids.generate());
    clock.advanceBy(1);
    const second = ids.toPublic(PREFIX, ids.generate());

    expect([second, first].toSorted()).toEqual([first, second]);
  });

  it('rejects a public id with another prefix', () => {
    const { ids } = createIds();
    const publicId = ids.toPublic(OTHER_PREFIX, ids.generate());

    expect(() => ids.fromPublic(PREFIX, publicId)).toThrow(InvalidIdError);
  });

  it('rejects a malformed public id', () => {
    const { ids } = createIds();

    expect(() => ids.fromPublic(PREFIX, `${PREFIX}${ID_SEPARATOR}not-an-id`)).toThrow(
      InvalidIdError,
    );
  });

  it('rejects a prefix that is not lowercase letters', () => {
    const { ids } = createIds();

    expect(() => ids.toPublic('Agt1', ids.generate())).toThrow(InvalidIdPrefixError);
  });
});
