import {
  CAMEL_TOPIC,
  COMPONENT_CONTEXT_SUFFIXES,
  COMPONENT_HOOK_SUFFIXES,
  COMPONENT_INDEX_FILE,
  COMPONENT_NAME,
  COMPONENT_OWN_SUFFIXES,
  COMPONENT_STORY_SUFFIX,
  COMPONENT_TEST_SUFFIXES,
  HOOK_TOPIC,
  JSON_FILE,
  LOCALE_NAME,
  MESSAGES,
  PATH_SEPARATOR,
  WEB_FEATURE_ROOT_FILE,
  STYLES_ENTRY_FILE,
  STYLES_FILE,
  WEB_APP_KINDS,
  WEB_APP_ROOT_FILES,
  WEB_COMPONENT_KINDS,
  WEB_FEATURE_COMPONENT_LAYERS,
  WEB_FEATURE_FLAT_KINDS,
  WEB_FEATURE_LAYER_KINDS,
  WEB_GQL_KIND,
  WEB_GQL_OPERATION_FOLDERS,
  WEB_HOOK_SUFFIXES,
  WEB_HOOK_TEST_SUFFIXES,
  WEB_HOOKS_KIND,
  WEB_KIND_SUFFIXES,
  WEB_LOCALES_KIND,
  WEB_ROUTE_FILE,
  WEB_SHARED_GENERIC_KINDS,
  WEB_SHARED_KINDS,
  WEB_SHARED_STYLES,
  WEB_SHARED_UI,
  WEB_SOURCE_ROOT_FILES,
  WEB_TEST_SUPPORT_KINDS,
  WEB_TEST_INTEGRATION_ROOT,
  WEB_TEST_SUFFIXES,
  WEB_TEST_SUPPORT_ROOT,
  WebRoot,
} from './check-structure.constants.ts';
import type { Segments, Verdict } from './check-structure.typedefs.ts';
import { checkFlatKind, fileRule, isKnownKind, matchesRule, testSuffixes } from './rule.helpers.ts';

const hookRule = fileRule(HOOK_TOPIC, WEB_HOOK_SUFFIXES, WEB_HOOK_TEST_SUFFIXES);
const gqlRule = fileRule(CAMEL_TOPIC, ['.graphql']);
const componentHookRule = fileRule(HOOK_TOPIC, COMPONENT_HOOK_SUFFIXES, COMPONENT_TEST_SUFFIXES);
const componentContextRule = fileRule(CAMEL_TOPIC, COMPONENT_CONTEXT_SUFFIXES);

const isComponentFile = (folder: string, name: string, stories: boolean): boolean => {
  const own = [...COMPONENT_OWN_SUFFIXES, ...COMPONENT_TEST_SUFFIXES];
  const owned = stories ? [...own, COMPONENT_STORY_SUFFIX] : own;
  return (
    name === COMPONENT_INDEX_FILE ||
    owned.some((suffix) => name === `${folder}${suffix}`) ||
    matchesRule(name, componentHookRule) ||
    matchesRule(name, componentContextRule)
  );
};

const checkComponentFolder = (folder: string, rest: Segments, stories: boolean): Verdict => {
  const [head, ...tail] = rest;
  if (head === undefined) {
    return null;
  }
  if (tail.length === 0) {
    return isComponentFile(folder, head, stories) ? null : MESSAGES.componentFile(head, folder);
  }
  return COMPONENT_NAME.test(head)
    ? checkComponentFolder(head, tail, stories)
    : MESSAGES.componentFolder(head);
};

const checkComponentTree = (segments: Segments, stories: boolean): Verdict => {
  const [head, ...tail] = segments;
  if (head === undefined) {
    return null;
  }
  if (tail.length === 0 || !COMPONENT_NAME.test(head)) {
    return MESSAGES.componentFolder(head);
  }
  return checkComponentFolder(head, tail, stories);
};

const checkGql = (rest: Segments): Verdict => {
  const [operation, ...tail] = rest;
  if (operation === undefined) {
    return null;
  }
  if (tail.length !== 1 || !WEB_GQL_OPERATION_FOLDERS.includes(operation)) {
    return MESSAGES.gqlFolder(operation);
  }
  const [file] = tail;
  return file !== undefined && matchesRule(file, gqlRule)
    ? null
    : MESSAGES.gqlFile(file ?? operation);
};

const checkLocales = (rest: Segments): Verdict => {
  const [language, ...tail] = rest;
  if (language === undefined) {
    return null;
  }
  if (tail.length !== 1 || !LOCALE_NAME.test(language)) {
    return MESSAGES.localeFolder(language);
  }
  const [file] = tail;
  return file !== undefined && JSON_FILE.test(file) ? null : MESSAGES.localeFile(file ?? language);
};

const checkWebKind = (kind: string, rest: Segments): Verdict => {
  if (kind === WEB_GQL_KIND) {
    return checkGql(rest);
  }
  if (kind === WEB_LOCALES_KIND) {
    return checkLocales(rest);
  }
  if (WEB_COMPONENT_KINDS.has(kind)) {
    return checkComponentTree(rest, false);
  }
  if (kind === WEB_HOOKS_KIND) {
    return checkFlatKind(kind, rest, hookRule);
  }
  const suffixes = WEB_KIND_SUFFIXES[kind];
  return suffixes === undefined
    ? null
    : checkFlatKind(kind, rest, fileRule(CAMEL_TOPIC, suffixes, testSuffixes(suffixes)));
};

const checkKinds = (segments: Segments, kinds: readonly string[]): Verdict => {
  const [kind, ...rest] = segments;
  if (kind === undefined) {
    return null;
  }
  if (rest.length === 0) {
    return MESSAGES.unexpectedFile(kind, kinds);
  }
  return isKnownKind(kind, kinds) ? checkWebKind(kind, rest) : MESSAGES.unknownFolder(kind, kinds);
};

const checkApp = (segments: Segments): Verdict => {
  const [head, ...rest] = segments;
  if (head === undefined) {
    return null;
  }
  if (rest.length === 0) {
    return WEB_APP_ROOT_FILES.includes(head)
      ? null
      : MESSAGES.unexpectedFile(head, WEB_APP_ROOT_FILES);
  }
  return checkKinds(segments, WEB_APP_KINDS);
};

const checkFeature = (segments: Segments): Verdict => {
  const [, ...inner] = segments;
  const [layer, ...rest] = inner;
  if (layer === undefined) {
    return MESSAGES.tooShort();
  }
  if (rest.length === 0) {
    return layer === WEB_FEATURE_ROOT_FILE
      ? null
      : MESSAGES.unexpectedFile(layer, [WEB_FEATURE_ROOT_FILE]);
  }
  if (WEB_FEATURE_FLAT_KINDS.includes(layer)) {
    return checkWebKind(layer, rest);
  }
  if (WEB_FEATURE_COMPONENT_LAYERS.includes(layer)) {
    return checkComponentTree(rest, false);
  }
  const kinds = WEB_FEATURE_LAYER_KINDS[layer];
  return kinds === undefined
    ? MESSAGES.unknownFolder(layer, [
        ...WEB_FEATURE_FLAT_KINDS,
        ...WEB_FEATURE_COMPONENT_LAYERS,
        ...Object.keys(WEB_FEATURE_LAYER_KINDS),
      ])
    : checkKinds(rest, kinds);
};

const checkShared = (segments: Segments): Verdict => {
  const [name, ...inner] = segments;
  if (name === undefined || inner.length === 0) {
    return MESSAGES.tooShort();
  }
  if (name === WEB_SHARED_UI) {
    return checkComponentTree(inner, true);
  }
  if (name === WEB_SHARED_STYLES) {
    const [file] = inner;
    return inner.length === 1 &&
      file !== undefined &&
      (STYLES_FILE.test(file) || file === STYLES_ENTRY_FILE)
      ? null
      : MESSAGES.stylesFile(inner.join(PATH_SEPARATOR));
  }
  return checkKinds(inner, WEB_SHARED_KINDS[name] ?? WEB_SHARED_GENERIC_KINDS);
};

export const checkWebSource = (segments: Segments): Verdict => {
  const [root, ...rest] = segments;
  if (root === undefined) {
    return MESSAGES.tooShort();
  }
  if (rest.length === 0) {
    return WEB_SOURCE_ROOT_FILES.includes(root)
      ? null
      : MESSAGES.unexpectedFile(root, WEB_SOURCE_ROOT_FILES);
  }
  if (root === WebRoot.Routes) {
    const last = segments[segments.length - 1] ?? root;
    return WEB_ROUTE_FILE.test(last) ? null : MESSAGES.routeFile(last);
  }
  if (root === WebRoot.App) {
    return checkApp(rest);
  }
  if (root === WebRoot.Features) {
    return checkFeature(rest);
  }
  if (root === WebRoot.Shared) {
    return checkShared(rest);
  }
  return MESSAGES.unknownFolder(root, Object.values(WebRoot));
};

export const checkWebTest = (segments: Segments): Verdict => {
  const [root, ...rest] = segments;
  if (root === undefined) {
    return MESSAGES.tooShort();
  }
  const last = segments[segments.length - 1] ?? root;
  if (root === WEB_TEST_INTEGRATION_ROOT && rest.length > 0) {
    return WEB_TEST_SUFFIXES.some((suffix) => last.endsWith(suffix))
      ? null
      : MESSAGES.webIntegrationTestOnly(last);
  }
  if (root !== WEB_TEST_SUPPORT_ROOT || rest.length === 0) {
    return MESSAGES.unknownFolder(root, [WEB_TEST_SUPPORT_ROOT, WEB_TEST_INTEGRATION_ROOT]);
  }
  return checkKinds(rest, WEB_TEST_SUPPORT_KINDS);
};
