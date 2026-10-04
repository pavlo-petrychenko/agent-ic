import {
  MESSAGES,
  NO_TESTS,
  SPEC_SUFFIX_PATTERN,
  SPEC_SUFFIX_REPLACEMENT,
} from './check-structure.constants.ts';
import type { FileRule, Segments, Verdict } from './check-structure.typedefs.ts';

const SCRIPT_EXTENSION_PATTERN = /(\.tsx?)$/;
const TEST_EXTENSION_REPLACEMENT = '.test$1';

export const fileRule = (
  topic: RegExp,
  suffixes: readonly string[],
  testSuffixes: readonly string[] = NO_TESTS,
): FileRule => ({ topic, suffixes, testSuffixes });

export const specSuffixes = (suffixes: readonly string[]): string[] =>
  suffixes
    .filter((suffix) => SPEC_SUFFIX_PATTERN.test(suffix))
    .map((suffix) => suffix.replace(SPEC_SUFFIX_PATTERN, SPEC_SUFFIX_REPLACEMENT));

export const testSuffixes = (suffixes: readonly string[]): string[] =>
  suffixes
    .filter((suffix) => SCRIPT_EXTENSION_PATTERN.test(suffix))
    .map((suffix) => suffix.replace(SCRIPT_EXTENSION_PATTERN, TEST_EXTENSION_REPLACEMENT));

export const matchesRule = (name: string, rule: FileRule): boolean =>
  [...rule.suffixes, ...rule.testSuffixes].some(
    (suffix) => name.endsWith(suffix) && rule.topic.test(name.slice(0, -suffix.length)),
  );

export const checkFlatKind = (kind: string, rest: Segments, rule: FileRule): Verdict => {
  const [name, ...deeper] = rest;
  if (name === undefined) {
    return null;
  }
  if (deeper.length > 0) {
    return MESSAGES.nestedKind(kind);
  }
  return matchesRule(name, rule) ? null : MESSAGES.badSuffix(name, kind, rule.suffixes);
};

export const isKnownKind = (kind: string, kinds: readonly string[]): boolean =>
  kinds.includes(kind);
