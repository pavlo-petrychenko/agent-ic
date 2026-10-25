import type { BaseCommand } from '@/app/commands/base.command';
import { UnknownCommand } from '@/app/commands/unknown.command';
import { ARGV_OFFSET, COMMAND_LABEL, CommandName } from '@/app/constants/command.constants';
import { commandNameSchema } from '@/app/schemas/command-name.schema';
import { toConfigIssues } from '@/platform/config/helpers/config-issue.helpers';

export const resolveCommand = async (argv: readonly string[]): Promise<BaseCommand> => {
  const [name, ...args] = argv.slice(ARGV_OFFSET);
  const command = commandNameSchema.safeParse(name);
  if (!command.success) {
    return new UnknownCommand(toConfigIssues(command.error, COMMAND_LABEL));
  }
  switch (command.data) {
    case CommandName.Serve: {
      const { ServeCommand } = await import('@/app/commands/serve.command');
      return new ServeCommand(args);
    }
    case CommandName.Migrate: {
      const { MigrateCommand } = await import('@/app/commands/migrate.command');
      return new MigrateCommand();
    }
    case CommandName.PrintSchema: {
      const { PrintSchemaCommand } = await import('@/app/commands/print-schema.command');
      return new PrintSchemaCommand(args);
    }
    case CommandName.Seed: {
      const { SeedCommand } = await import('@/app/commands/seed.command');
      return new SeedCommand();
    }
  }
};
