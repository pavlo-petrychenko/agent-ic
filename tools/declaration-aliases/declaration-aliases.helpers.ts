import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import {
  ALIAS_WILDCARD,
  BUILD_CONFIG_FILE,
  CURRENT_DIRECTORY,
  DECLARATION_EXTENSION,
  EMITTED_EXTENSION,
  PARENT_DIRECTORY,
  PATHS_CONFIG_FILE,
  SPECIFIER_PATTERN,
} from './declaration-aliases.constants.ts';
import type {
  DeclarationAlias,
  DeclarationLayout,
  TsconfigFile,
  UnresolvedSpecifier,
} from './declaration-aliases.typedefs.ts';

const readTsconfig = (file: string): TsconfigFile =>
  JSON.parse(readFileSync(file, 'utf8')) as TsconfigFile;

const stripWildcard = (pattern: string): string =>
  pattern.endsWith(ALIAS_WILDCARD) ? pattern.slice(0, -ALIAS_WILDCARD.length) : pattern;

const isInside = (directory: string, path: string): boolean => {
  const fromDirectory = relative(directory, path);
  return (
    fromDirectory === '' || (!fromDirectory.startsWith('..') && !fromDirectory.startsWith(sep))
  );
};

const toPosix = (path: string): string => path.split(sep).join('/');

export const readDeclarationLayout = (packageDir: string): DeclarationLayout => {
  const paths = readTsconfig(join(packageDir, PATHS_CONFIG_FILE)).compilerOptions?.paths ?? {};
  const build = readTsconfig(join(packageDir, BUILD_CONFIG_FILE)).compilerOptions ?? {};
  const rootDir = resolve(packageDir, build.rootDir ?? '.');
  const outDir = resolve(packageDir, build.outDir ?? '.');
  const aliases: DeclarationAlias[] = [];
  for (const [pattern, targets] of Object.entries(paths)) {
    const target = targets[0];
    if (target === undefined) {
      continue;
    }
    const sourceDir = resolve(packageDir, stripWildcard(target));
    if (isInside(rootDir, sourceDir)) {
      aliases.push({
        prefix: stripWildcard(pattern),
        outputDir: resolve(outDir, relative(rootDir, sourceDir)),
      });
    }
  }
  return { aliases, prefixes: Object.keys(paths).map(stripWildcard), outDir };
};

const relativeSpecifier = (fromFile: string, target: string): string => {
  const path = toPosix(relative(dirname(fromFile), target));
  return path.startsWith(PARENT_DIRECTORY) ? path : `${CURRENT_DIRECTORY}${path}`;
};

const withEmittedExtension = (path: string): string =>
  path.endsWith(EMITTED_EXTENSION) ? path : `${path}${EMITTED_EXTENSION}`;

export const rewriteSpecifiers = (
  source: string,
  file: string,
  aliases: readonly DeclarationAlias[],
): string =>
  source.replace(SPECIFIER_PATTERN, (match, lead: string, quote: string, specifier: string) => {
    const alias = aliases.find((candidate) => specifier.startsWith(candidate.prefix));
    if (alias === undefined) {
      return match;
    }
    const target = withEmittedExtension(
      join(alias.outputDir, specifier.slice(alias.prefix.length)),
    );
    return `${lead}${quote}${relativeSpecifier(file, target)}${quote}`;
  });

export const findAliasSpecifiers = (
  source: string,
  prefixes: readonly string[],
): readonly string[] =>
  [...source.matchAll(SPECIFIER_PATTERN)]
    .map((match) => match[3] ?? '')
    .filter((specifier) => prefixes.some((prefix) => specifier.startsWith(prefix)));

const listDeclarations = (directory: string): readonly string[] =>
  readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith(DECLARATION_EXTENSION))
    .map((file) => join(directory, file));

export const rewriteDeclarations = (packageDir: string): readonly UnresolvedSpecifier[] => {
  const layout = readDeclarationLayout(packageDir);
  return listDeclarations(layout.outDir).flatMap((file) => {
    const rewritten = rewriteSpecifiers(readFileSync(file, 'utf8'), file, layout.aliases);
    writeFileSync(file, rewritten);
    return findAliasSpecifiers(rewritten, layout.prefixes).map((specifier) => ({
      file: relative(packageDir, file),
      specifier,
    }));
  });
};
