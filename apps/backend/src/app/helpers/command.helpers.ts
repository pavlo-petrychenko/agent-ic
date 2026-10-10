import type { BaseCommand } from '@/app/commands/base.command';
import { MigrateCommand } from '@/app/commands/migrate.command';
import { PrintSchemaCommand } from '@/app/commands/print-schema.command';
import { SeedCommand } from '@/app/commands/seed.command';
import { ServeCommand } from '@/app/commands/serve.command';
import { UnknownCommand } from '@/app/commands/unknown.command';
import { ARGV_OFFSET, COMMAND_LABEL, CommandName } from '@/app/constants/command.constants';
import { commandNameSchema } from '@/app/schemas/command-name.schema';
import { toConfigIssues } from '@/platform/config/helpers/config-issue.helpers';

export const resolveCommand = (argv: readonly string[]): BaseCommand => {
  const [name, ...args] = argv.slice(ARGV_OFFSET);
  const command = commandNameSchema.safeParse(name);
  if (!command.success) {
    return new UnknownCommand(toConfigIssues(command.error, COMMAND_LABEL));
  }
  switch (command.data) {
    case CommandName.Serve:
      return new ServeCommand(args);
    case CommandName.Migrate:
      return new MigrateCommand();
    case CommandName.PrintSchema:
      return new PrintSchemaCommand(args);
    case CommandName.Seed:
      return new SeedCommand();
  }
};
