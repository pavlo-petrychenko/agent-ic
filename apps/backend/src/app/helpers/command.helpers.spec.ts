import { EOL } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MigrateCommand } from '@/app/commands/migrate.command';
import { PrintSchemaCommand } from '@/app/commands/print-schema.command';
import { SeedCommand } from '@/app/commands/seed.command';
import { ServeCommand } from '@/app/commands/serve.command';
import { UnknownCommand } from '@/app/commands/unknown.command';
import { CliOption } from '@/app/constants/command-line.constants';
import { COMMAND_LABEL, CommandName, ExitCode } from '@/app/constants/command.constants';
import { resolveCommand } from '@/app/helpers/command.helpers';
import { CONFIG_ERROR_HEADER } from '@/platform/config/constants/config-issue.constants';
import { cliArgument, createArgv } from '@test/support/fixtures/test-env.fixture';

const UNKNOWN_COMMAND = 'unknown';

describe('resolveCommand', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it('resolves each command by its name', async () => {
    await expect(resolveCommand(createArgv(CommandName.Serve))).resolves.toBeInstanceOf(
      ServeCommand,
    );
    await expect(resolveCommand(createArgv(CommandName.Migrate))).resolves.toBeInstanceOf(
      MigrateCommand,
    );
    await expect(resolveCommand(createArgv(CommandName.PrintSchema))).resolves.toBeInstanceOf(
      PrintSchemaCommand,
    );
    await expect(resolveCommand(createArgv(CommandName.Seed))).resolves.toBeInstanceOf(SeedCommand);
  });

  it('answers a missing or unknown command with a config error', async () => {
    await expect(resolveCommand(createArgv())).resolves.toBeInstanceOf(UnknownCommand);
    await expect(resolveCommand(createArgv(UNKNOWN_COMMAND))).resolves.toBeInstanceOf(
      UnknownCommand,
    );
  });

  it('prints an unknown command and exits with the invalid config code', async () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const command = await resolveCommand(createArgv(UNKNOWN_COMMAND));
    await command.execute();

    const [output] = stderr.mock.calls[0] ?? [];
    expect(String(output)).toMatch(new RegExp(`^${CONFIG_ERROR_HEADER}`));
    expect(String(output)).toContain(COMMAND_LABEL);
    expect(String(output).endsWith(EOL)).toBe(true);
    expect(process.exitCode).toBe(ExitCode.InvalidConfig);
  });

  it('prints invalid serve flags before loading anything', async () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const command = await resolveCommand(
      createArgv(CommandName.Serve, cliArgument(CliOption.Role, UNKNOWN_COMMAND)),
    );
    await command.execute();

    expect(String(stderr.mock.calls[0]?.[0])).toContain(`--${CliOption.Role}`);
    expect(process.exitCode).toBe(ExitCode.InvalidConfig);
  });
});
