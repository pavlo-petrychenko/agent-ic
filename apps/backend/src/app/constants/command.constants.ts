export enum CommandName {
  Serve = 'serve',
  Migrate = 'migrate',
  PrintSchema = 'print-schema',
  Seed = 'seed',
  BackfillPrompts = 'backfill-prompts',
}

export enum ExitCode {
  InvalidConfig = 1,
}

export const ARGV_OFFSET = 2;
export const COMMAND_LABEL = 'command';
