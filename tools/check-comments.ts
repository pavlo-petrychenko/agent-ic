import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

import { parseSync } from 'oxc-parser';

interface Violation {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly text: string;
}

interface Comment {
  readonly kind: 'line' | 'block';
  readonly start: number;
  readonly value: string;
}

const scriptExtensions = new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs']);
const styleExtensions = new Set(['.scss']);
const ignoredPrefixes = ['node_modules/', 'dist/', '.turbo/', 'coverage/'];

const allowedDirectives = [
  /^oxlint-disable-next-line\s+\S+/,
  /^@ts-expect-error(\s|$)/,
  /^\/\s*<reference\s/,
];

const isAllowed = (comment: Comment): boolean => {
  const text = comment.value.trim();
  return allowedDirectives.some((directive) => directive.test(text));
};

const listFiles = (): string[] => {
  const output = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return output.split('\0').filter((file) => file.length > 0);
};

const isScanned = (file: string): boolean => {
  const extension = extname(file);
  const supported = scriptExtensions.has(extension) || styleExtensions.has(extension);
  return supported && !ignoredPrefixes.some((prefix) => file.startsWith(prefix));
};

const scriptComments = (file: string, source: string): Comment[] => {
  const result = parseSync(file, source);
  return result.comments.map((comment) => ({
    kind: comment.type === 'Line' ? 'line' : 'block',
    start: comment.start,
    value: comment.value,
  }));
};

const styleComments = (source: string): Comment[] => {
  const comments: Comment[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' || char === "'") {
      index = skipString(source, index, char);
    } else if (char === '/' && next === '/') {
      const end = source.indexOf('\n', index);
      const stop = end === -1 ? source.length : end;
      comments.push({ kind: 'line', start: index, value: source.slice(index + 2, stop) });
      index = stop;
    } else if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      const stop = end === -1 ? source.length : end + 2;
      comments.push({ kind: 'block', start: index, value: source.slice(index + 2, stop - 2) });
      index = stop;
    } else if (source.startsWith('url(', index) && !/^url\(\s*["']/.test(source.slice(index))) {
      const end = source.indexOf(')', index);
      index = end === -1 ? source.length : end + 1;
    } else {
      index += 1;
    }
  }
  return comments;
};

const skipString = (source: string, start: number, quote: string): number => {
  let index = start + 1;
  while (index < source.length && source[index] !== quote && source[index] !== '\n') {
    index += source[index] === '\\' ? 2 : 1;
  }
  return index + 1;
};

const locate = (source: string, offset: number): { line: number; column: number } => {
  const before = source.slice(0, offset);
  const line = before.split('\n').length;
  const column = offset - before.lastIndexOf('\n');
  return { line, column };
};

const summarise = (comment: Comment): string => {
  const text = comment.value.trim().split('\n')[0] ?? '';
  const shown = text.length > 60 ? `${text.slice(0, 57)}...` : text;
  return comment.kind === 'line' ? `// ${shown}` : `/* ${shown} */`;
};

const check = (file: string): Violation[] => {
  const source = readFileSync(file, 'utf8');
  const comments = styleExtensions.has(extname(file))
    ? styleComments(source)
    : scriptComments(file, source);
  return comments
    .filter((comment) => !isAllowed(comment))
    .map((comment) => ({ file, ...locate(source, comment.start), text: summarise(comment) }));
};

const requested = process.argv.slice(2);
const candidates = requested.length > 0 ? requested : listFiles();
const violations = candidates.filter(isScanned).flatMap(check);

for (const violation of violations) {
  process.stderr.write(
    `${violation.file}:${violation.line}:${violation.column}  ${violation.text}\n`,
  );
}

if (violations.length > 0) {
  process.stderr.write(
    `\n${violations.length} comment(s) found. Remove them: rename or extract instead.\n` +
      'Allowed: oxlint-disable-next-line <rule>, @ts-expect-error, /// <reference>.\n',
  );
  process.exit(1);
}
