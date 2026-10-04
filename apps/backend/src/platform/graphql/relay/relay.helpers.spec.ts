import { describe, expect, it } from 'vitest';

import { InvalidCursorError } from './invalid-cursor.error';
import { InvalidPageSizeError } from './invalid-page-size.error';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from './relay.constants';
import { decodeCursor, encodeCursor, toConnection, toPageRequest } from './relay.helpers';

const IDS = [
  '0199b0a0-0000-7000-8000-000000000001',
  '0199b0a0-0000-7000-8000-000000000002',
  '0199b0a0-0000-7000-8000-000000000003',
];

interface Row {
  readonly id: string;
}

const rows = (count: number): Row[] => IDS.slice(0, count).map((id) => ({ id }));
const idOf = (row: Row): string => row.id;

describe('relay cursors', () => {
  it('round-trips an id through an opaque cursor', () => {
    const [id = ''] = IDS;
    const cursor = encodeCursor(id);

    expect(cursor).not.toContain(id);
    expect(decodeCursor(cursor)).toBe(id);
  });

  it('rejects a cursor it did not issue', () => {
    expect(() => decodeCursor('not-a-cursor')).toThrow(InvalidCursorError);
  });
});

describe('toPageRequest', () => {
  it('uses the default page size and fetches one row ahead', () => {
    expect(toPageRequest({})).toEqual({
      first: PAGE_SIZE_DEFAULT,
      afterId: null,
      fetchSize: PAGE_SIZE_DEFAULT + 1,
    });
  });

  it('decodes the after cursor', () => {
    const [, second = ''] = IDS;

    expect(toPageRequest({ first: 2, after: encodeCursor(second) }).afterId).toBe(second);
  });

  it('rejects a page size out of range', () => {
    expect(() => toPageRequest({ first: 0 })).toThrow(InvalidPageSizeError);
    expect(() => toPageRequest({ first: PAGE_SIZE_MAX + 1 })).toThrow(InvalidPageSizeError);
  });
});

describe('toConnection', () => {
  it('reports a next page when the lookahead row exists', () => {
    const request = toPageRequest({ first: 2 });

    const connection = toConnection(rows(3), request, idOf);

    expect(connection.edges.map((edge) => edge.node.id)).toEqual(IDS.slice(0, 2));
    expect(connection.pageInfo).toEqual({
      endCursor: encodeCursor(IDS[1] ?? ''),
      hasNextPage: true,
    });
  });

  it('reports the last page and an empty one', () => {
    const request = toPageRequest({ first: 2 });

    expect(toConnection(rows(2), request, idOf).pageInfo.hasNextPage).toBe(false);
    expect(toConnection(rows(0), request, idOf).pageInfo).toEqual({
      endCursor: null,
      hasNextPage: false,
    });
  });
});
