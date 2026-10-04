import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { checkBackendSource, checkBackendTest } from './backend-structure.helpers.ts';
import {
  GENERATED_FILE_PATTERN,
  IGNORED_DIRECTORIES,
  PATH_SEPARATOR,
  STRUCTURE_AREAS,
} from './check-structure.constants.ts';
import type { Segments, StructureAreas, Verdict, Violation } from './check-structure.typedefs.ts';
import { checkWebSource, checkWebTest } from './web-structure.helpers.ts';

type AreaChecker = (segments: Segments) => Verdict;

export const listFiles = (directory: string, prefix: Segments = []): string[][] =>
  readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      if (entry.isDirectory()) {
        return IGNORED_DIRECTORIES.has(entry.name)
          ? []
          : listFiles(join(directory, entry.name), [...prefix, entry.name]);
      }
      return GENERATED_FILE_PATTERN.test(entry.name) ? [] : [[...prefix, entry.name]];
    });

const checkArea = (root: string, area: string, checker: AreaChecker): Violation[] => {
  const directory = join(root, area);
  if (!existsSync(directory)) {
    return [];
  }
  return listFiles(directory).flatMap((segments) => {
    const message = checker(segments);
    return message === null ? [] : [{ file: [area, ...segments].join(PATH_SEPARATOR), message }];
  });
};

export const checkStructure = (
  root: string,
  areas: StructureAreas = STRUCTURE_AREAS,
): Violation[] => [
  ...checkArea(root, areas.backendSource, checkBackendSource),
  ...checkArea(root, areas.backendTest, checkBackendTest),
  ...checkArea(root, areas.webSource, checkWebSource),
  ...checkArea(root, areas.webTest, checkWebTest),
];

export const formatViolation = (violation: Violation): string =>
  `${violation.file}: ${violation.message}`;
