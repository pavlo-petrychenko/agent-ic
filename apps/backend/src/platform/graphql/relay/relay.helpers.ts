import { UUID_PATTERN } from '@/platform/ids/ids.constants';

import { InvalidCursorError } from './invalid-cursor.error';
import { InvalidPageSizeError } from './invalid-page-size.error';
import {
  CURSOR_ENCODING,
  CURSOR_PREFIX,
  CURSOR_TEXT_ENCODING,
  PAGE_LOOKAHEAD_ROWS,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  PAGE_SIZE_MIN,
} from './relay.constants';
import type { Connection, ConnectionArgs, PageRequest } from './relay.typedefs';

export const encodeCursor = (id: string): string =>
  Buffer.from(`${CURSOR_PREFIX}${id}`, CURSOR_TEXT_ENCODING).toString(CURSOR_ENCODING);

export const decodeCursor = (cursor: string): string => {
  const decoded = Buffer.from(cursor, CURSOR_ENCODING).toString(CURSOR_TEXT_ENCODING);
  const id = decoded.slice(CURSOR_PREFIX.length);
  if (!decoded.startsWith(CURSOR_PREFIX) || !UUID_PATTERN.test(id)) {
    throw new InvalidCursorError(cursor);
  }
  return id;
};

export const toPageRequest = (args: ConnectionArgs): PageRequest => {
  const first = args.first ?? PAGE_SIZE_DEFAULT;
  if (!Number.isInteger(first) || first < PAGE_SIZE_MIN || first > PAGE_SIZE_MAX) {
    throw new InvalidPageSizeError(first);
  }
  const after = args.after ?? null;
  return {
    first,
    afterId: after === null ? null : decodeCursor(after),
    fetchSize: first + PAGE_LOOKAHEAD_ROWS,
  };
};

export const toConnection = <TNode>(
  rows: readonly TNode[],
  request: PageRequest,
  idOf: (node: TNode) => string,
): Connection<TNode> => {
  const edges = rows
    .slice(0, request.first)
    .map((node) => ({ cursor: encodeCursor(idOf(node)), node }));
  return {
    edges,
    pageInfo: { endCursor: edges.at(-1)?.cursor ?? null, hasNextPage: rows.length > request.first },
  };
};
