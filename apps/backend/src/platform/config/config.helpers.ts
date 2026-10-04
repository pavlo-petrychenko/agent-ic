import { parseArgs } from 'node:util';
import type { z } from 'zod';

import {
  ARGV_OFFSET,
  CLI_OPTION_PREFIX,
  CONFIG_ERROR_HEADER,
  CONFIG_ISSUE_LINE_PREFIX,
  CONFIG_ISSUE_LINE_SEPARATOR,
  CONFIG_ISSUE_PATH_SEPARATOR,
  CONFIG_ISSUE_VALUE_SEPARATOR,
  CliOption,
  QUEUE_LIST_SEPARATOR,
  SchemaPrintOption,
  STRING_OPTION,
} from './config.constants';
import type { ConfigIssue, RawCliOptions, RawSchemaPrintOptions } from './config.typedefs';

export const readCliOptions = (argv: readonly string[]): RawCliOptions => {
  const { values } = parseArgs({
    args: argv.slice(ARGV_OFFSET),
    options: {
      [CliOption.Role]: STRING_OPTION,
      [CliOption.Queues]: STRING_OPTION,
    },
    strict: true,
    allowPositionals: false,
  });
  const queues = values[CliOption.Queues];
  return {
    role: values[CliOption.Role],
    queues: queues === undefined ? [] : queues.split(QUEUE_LIST_SEPARATOR),
  };
};

export const readSchemaPrintOptions = (argv: readonly string[]): RawSchemaPrintOptions => {
  const { values } = parseArgs({
    args: argv.slice(ARGV_OFFSET),
    options: { [SchemaPrintOption.Output]: STRING_OPTION },
    strict: true,
    allowPositionals: false,
  });
  return { output: values[SchemaPrintOption.Output] };
};

export const toConfigIssues = (error: z.ZodError, prefix = ''): ConfigIssue[] =>
  error.issues.map((issue) => ({
    variable: `${prefix}${issue.path.join(CONFIG_ISSUE_PATH_SEPARATOR)}`,
    message: issue.message,
  }));

export const toCliIssues = (error: z.ZodError): ConfigIssue[] =>
  toConfigIssues(error, CLI_OPTION_PREFIX);

export const formatConfigIssues = (issues: readonly ConfigIssue[]): string =>
  [
    CONFIG_ERROR_HEADER,
    ...issues.map(
      (issue) =>
        `${CONFIG_ISSUE_LINE_PREFIX}${issue.variable}${CONFIG_ISSUE_VALUE_SEPARATOR}${issue.message}`,
    ),
  ].join(CONFIG_ISSUE_LINE_SEPARATOR);
