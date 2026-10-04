import {
  APP_MODULE_FILE,
  BACKEND_APP_KINDS,
  BACKEND_KIND_FOLDERS,
  BACKEND_KIND_SUFFIXES,
  BACKEND_MODULE_KINDS,
  BACKEND_PLATFORM_KINDS,
  BACKEND_SOURCE_ROOT_FILE,
  BACKEND_TEST_SUPPORT_SUFFIXES,
  BackendRoot,
  BackendTestRoot,
  DATABASE_CLIENTS_MODULE_FILE,
  DATABASE_PLATFORM_MODULE,
  PLATFORM_KIND_NAME_EXCEPTIONS,
  INDEX_FILE,
  KEBAB_TOPIC,
  MESSAGES,
  MODULE_FILE_SUFFIX,
  SPEC_FILE_EXTENSION,
} from './check-structure.constants.ts';
import type { Segments, Verdict } from './check-structure.typedefs.ts';
import { checkFlatKind, fileRule, isKnownKind, specSuffixes } from './rule.helpers.ts';

type RootMessage = (file: string) => string;

const kindRule = (suffixes: readonly string[]) =>
  fileRule(KEBAB_TOPIC, suffixes, specSuffixes(suffixes));

const checkKindFolder = (
  kind: string,
  rest: Segments,
  table: Readonly<Record<string, readonly string[]>>,
): Verdict => {
  const suffixes = table[kind];
  return suffixes === undefined ? null : checkFlatKind(kind, rest, kindRule(suffixes));
};

const checkAreaFolder = (
  segments: Segments,
  kinds: readonly string[],
  rootFiles: readonly string[],
  rootMessage: RootMessage,
  table: Readonly<Record<string, readonly string[]>>,
): Verdict => {
  const [head, ...rest] = segments;
  if (head === undefined) {
    return null;
  }
  if (rest.length === 0) {
    return rootFiles.includes(head) ? null : rootMessage(head);
  }
  return isKnownKind(head, kinds)
    ? checkKindFolder(head, rest, table)
    : MESSAGES.unknownFolder(head, kinds);
};

const checkModule = (segments: Segments): Verdict => {
  const [name, ...inner] = segments;
  if (name === undefined || inner.length === 0) {
    return MESSAGES.tooShort();
  }
  return checkAreaFolder(
    inner,
    BACKEND_MODULE_KINDS,
    [`${name}${MODULE_FILE_SUFFIX}`, INDEX_FILE],
    (file) => MESSAGES.moduleRootFile(file, name),
    BACKEND_KIND_SUFFIXES,
  );
};

const platformRootFiles = (name: string): string[] => {
  const own = [`${name}${MODULE_FILE_SUFFIX}`, INDEX_FILE];
  return name === DATABASE_PLATFORM_MODULE ? [...own, DATABASE_CLIENTS_MODULE_FILE] : own;
};

const checkPlatform = (segments: Segments): Verdict => {
  const [name, ...inner] = segments;
  if (name === undefined) {
    return MESSAGES.tooShort();
  }
  if (inner.length === 0) {
    return MESSAGES.platformRootFile(name);
  }
  if (BACKEND_KIND_FOLDERS.includes(name) && !PLATFORM_KIND_NAME_EXCEPTIONS.includes(name)) {
    return MESSAGES.platformKindName(name);
  }
  return checkAreaFolder(
    inner,
    BACKEND_PLATFORM_KINDS,
    platformRootFiles(name),
    (file) => MESSAGES.unexpectedFile(file, platformRootFiles(name)),
    BACKEND_KIND_SUFFIXES,
  );
};

const checkApp = (segments: Segments): Verdict =>
  checkAreaFolder(
    segments,
    BACKEND_APP_KINDS,
    [APP_MODULE_FILE],
    (file) => MESSAGES.unexpectedFile(file, [APP_MODULE_FILE]),
    BACKEND_KIND_SUFFIXES,
  );

export const checkBackendSource = (segments: Segments): Verdict => {
  const [root, ...rest] = segments;
  if (root === undefined) {
    return MESSAGES.tooShort();
  }
  if (rest.length === 0) {
    return root === BACKEND_SOURCE_ROOT_FILE
      ? null
      : MESSAGES.unexpectedFile(root, [BACKEND_SOURCE_ROOT_FILE]);
  }
  if (root === BackendRoot.App) {
    return checkApp(rest);
  }
  if (root === BackendRoot.Modules) {
    return checkModule(rest);
  }
  if (root === BackendRoot.Platform) {
    return checkPlatform(rest);
  }
  return MESSAGES.unknownFolder(root, Object.values(BackendRoot));
};

export const checkBackendTest = (segments: Segments): Verdict => {
  const [root, ...rest] = segments;
  if (root === undefined) {
    return MESSAGES.tooShort();
  }
  const last = segments[segments.length - 1] ?? root;
  if (root === BackendTestRoot.Integration && rest.length > 0) {
    return last.endsWith(SPEC_FILE_EXTENSION) ? null : MESSAGES.integrationSpecOnly(last);
  }
  if (root === BackendTestRoot.Support && rest.length > 0) {
    return checkSupport(rest);
  }
  return MESSAGES.unknownFolder(root, Object.values(BackendTestRoot));
};

const checkSupport = (segments: Segments): Verdict => {
  const [kind, ...rest] = segments;
  if (kind === undefined) {
    return MESSAGES.tooShort();
  }
  const kinds = Object.keys(BACKEND_TEST_SUPPORT_SUFFIXES);
  if (rest.length === 0) {
    return MESSAGES.unexpectedFile(kind, kinds);
  }
  return isKnownKind(kind, kinds)
    ? checkKindFolder(kind, rest, BACKEND_TEST_SUPPORT_SUFFIXES)
    : MESSAGES.unknownFolder(kind, kinds);
};
