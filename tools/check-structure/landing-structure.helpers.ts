import {
  CAMEL_TOPIC,
  LANDING_KIND_SUFFIXES,
  LANDING_LOCALE_FILE,
  LANDING_SOURCE_ROOT_FILES,
  LandingRoot,
  MESSAGES,
  STYLES_FILE,
} from './check-structure.constants.ts';
import type { Segments, Verdict } from './check-structure.typedefs.ts';
import { checkFlatKind, fileRule, testSuffixes } from './rule.helpers.ts';

const LANDING_FOLDERS: readonly string[] = [
  ...Object.values(LandingRoot),
  ...Object.keys(LANDING_KIND_SUFFIXES),
];

const checkFlatFile = (
  kind: string,
  rest: Segments,
  pattern: RegExp,
  message: (name: string) => string,
): Verdict => {
  const [name, ...deeper] = rest;
  if (deeper.length > 0) {
    return MESSAGES.nestedKind(kind);
  }
  return name === undefined || pattern.test(name) ? null : message(name);
};

export const checkLandingSource = (segments: Segments): Verdict => {
  const [root, ...rest] = segments;
  if (root === undefined) {
    return MESSAGES.tooShort();
  }
  if (rest.length === 0) {
    return LANDING_SOURCE_ROOT_FILES.includes(root)
      ? null
      : MESSAGES.unexpectedFile(root, LANDING_SOURCE_ROOT_FILES);
  }
  if (root === LandingRoot.Locales) {
    return checkFlatFile(root, rest, LANDING_LOCALE_FILE, MESSAGES.landingLocaleFile);
  }
  if (root === LandingRoot.Styles) {
    return checkFlatFile(root, rest, STYLES_FILE, MESSAGES.landingStylesFile);
  }
  const suffixes = LANDING_KIND_SUFFIXES[root];
  if (suffixes === undefined) {
    return MESSAGES.unknownFolder(root, LANDING_FOLDERS);
  }
  return checkFlatKind(root, rest, fileRule(CAMEL_TOPIC, suffixes, testSuffixes(suffixes)));
};
