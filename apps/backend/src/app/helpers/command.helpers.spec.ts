import { EOL } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MigrateCommand } from '@/app/commands/migrate.command';
import { PrintSchemaCommand } from '@/app/commands/print-schema.command';
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

  it('resolves each command by its name', () => {
    expect(resolveCommand(createArgv(CommandName.Serve))).toBeInstanceOf(ServeCommand);
    expect(resolveCommand(createArgv(CommandName.Migrate))).toBeInstanceOf(MigrateCommand);
    expect(resolveCommand(createArgv(CommandName.PrintSchema))).toBeInstanceOf(PrintSchemaCommand);
  });

  it('answers a missing or unknown command with a config error', () => {
    expect(resolveCommand(createArgv())).toBeInstanceOf(UnknownCommand);
    expect(resolveCommand(createArgv(UNKNOWN_COMMAND))).toBeInstanceOf(UnknownCommand);
  });

  it('prints an unknown command and exits with the invalid config code', async () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    await resolveCommand(createArgv(UNKNOWN_COMMAND)).execute();

    const [output] = stderr.mock.calls[0] ?? [];
    expect(String(output)).toMatch(new RegExp(`^${CONFIG_ERROR_HEADER}`));
    expect(String(output)).toContain(COMMAND_LABEL);
    expect(String(output).endsWith(EOL)).toBe(true);
    expect(process.exitCode).toBe(ExitCode.InvalidConfig);
  });

  it('prints invalid serve flags before loading anything', async () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    await resolveCommand(
      createArgv(CommandName.Serve, cliArgument(CliOption.Role, UNKNOWN_COMMAND)),
    ).execute();

    expect(String(stderr.mock.calls[0]?.[0])).toContain(`--${CliOption.Role}`);
    expect(process.exitCode).toBe(ExitCode.InvalidConfig);
  });
});
