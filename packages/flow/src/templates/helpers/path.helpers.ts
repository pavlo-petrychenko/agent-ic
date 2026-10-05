import {
  INDEX_CLOSE,
  INDEX_OPEN,
  PATH_NAME_PATTERN,
  PATH_SEPARATOR,
  PATH_TAIL_PATTERN,
  PathSegmentKind,
} from '@flow/templates/constants/template.constants';
import type { PathSegment } from '@flow/templates/typedefs/template.typedefs';

export const parseVariablePath = (path: string): readonly PathSegment[] | null => {
  const text = path.trim();
  const root = PATH_NAME_PATTERN.exec(text);
  if (root === null) {
    return null;
  }
  const segments: PathSegment[] = [{ kind: PathSegmentKind.Name, name: root[0] }];
  const tail = new RegExp(PATH_TAIL_PATTERN.source, PATH_TAIL_PATTERN.flags);
  let position = root[0].length;
  while (position < text.length) {
    tail.lastIndex = position;
    const match = tail.exec(text);
    if (match === null) {
      return null;
    }
    const [whole, name, index] = match;
    segments.push(
      name === undefined
        ? { kind: PathSegmentKind.Index, index: Number(index) }
        : { kind: PathSegmentKind.Name, name },
    );
    position += whole.length;
  }
  return segments;
};

export const formatVariablePath = (segments: readonly PathSegment[]): string =>
  segments
    .map((segment, position) => {
      if (segment.kind === PathSegmentKind.Index) {
        return `${INDEX_OPEN}${segment.index}${INDEX_CLOSE}`;
      }
      return position === 0 ? segment.name : `${PATH_SEPARATOR}${segment.name}`;
    })
    .join('');

const readSegment = (value: unknown, segment: PathSegment): unknown => {
  if (segment.kind === PathSegmentKind.Index) {
    return Array.isArray(value) ? value[segment.index] : undefined;
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return Object.hasOwn(value, segment.name) ? Reflect.get(value, segment.name) : undefined;
  }
  return undefined;
};

export const resolvePath = (root: unknown, path: string): unknown => {
  const segments = parseVariablePath(path);
  if (segments === null) {
    return null;
  }
  const value = segments.reduce<unknown>((current, segment) => readSegment(current, segment), root);
  return value === undefined ? null : value;
};
