import { parseArgs } from 'node:util';
import type { z } from 'zod';
import {
  CLI_ARGUMENTS_LABEL,
  CLI_OPTION_PREFIX,
  CliOption,
  QUEUE_LIST_SEPARATOR,
  STRING_OPTION,
} from '@/app/constants/command-line.constants';
import { printSchemaCommandSchema } from '@/app/schemas/print-schema-command.schema';
import { serveCommandSchema } from '@/app/schemas/serve-command.schema';
import type {
  PrintSchemaArguments,
  RawPrintSchemaOptions,
  RawServeOptions,
} from '@/app/typedefs/command-line.typedefs';
import { ConfigError } from '@/platform/config/errors/config.error';
import { toConfigIssues } from '@/platform/config/helpers/config-issue.helpers';
import type { RoleSelection } from '@/platform/config/typedefs/app-config.typedefs';
import type { ConfigIssue } from '@/platform/config/typedefs/config-issue.typedefs';

const toCliIssues = (error: z.ZodError): ConfigIssue[] => toConfigIssues(error, CLI_OPTION_PREFIX);

const readCommandLine = <TOptions>(read: () => TOptions): TOptions => {
  try {
    return read();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ConfigError([{ variable: CLI_ARGUMENTS_LABEL, message: error.message }]);
    }
    throw error;
  }
};

const readServeOptions = (args: readonly string[]): RawServeOptions => {
  const { values } = parseArgs({
    args: [...args],
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

const readPrintSchemaOptions = (args: readonly string[]): RawPrintSchemaOptions => {
  const { values } = parseArgs({
    args: [...args],
    options: { [CliOption.Output]: STRING_OPTION },
    strict: true,
    allowPositionals: false,
  });
  return { output: values[CliOption.Output] };
};

export const parseServeArguments = (args: readonly string[]): RoleSelection => {
  const parsed = serveCommandSchema.safeParse(readCommandLine(() => readServeOptions(args)));
  if (!parsed.success) {
    throw new ConfigError(toCliIssues(parsed.error));
  }
  return parsed.data;
};

export const parsePrintSchemaArguments = (args: readonly string[]): PrintSchemaArguments => {
  const parsed = printSchemaCommandSchema.safeParse(
    readCommandLine(() => readPrintSchemaOptions(args)),
  );
  if (!parsed.success) {
    throw new ConfigError(toCliIssues(parsed.error));
  }
  return parsed.data;
};
