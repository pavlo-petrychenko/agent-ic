import { describe, expect, it } from 'vitest';
import { CLI_ARGUMENTS_LABEL, CliOption } from '@/app/constants/command-line.constants';
import { parsePrintSchemaArguments, parseServeArguments } from '@/app/helpers/command-line.helpers';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { cliArgument } from '@test/support/fixtures/test-env.fixture';
import { issuesOf, variablesOf } from '@test/support/helpers/config-issue.helpers';

const SCHEMA_OUTPUT = 'schema.graphql';

describe('parseServeArguments', () => {
  it('reads the role', () => {
    expect(parseServeArguments([cliArgument(CliOption.Role, Role.Api)])).toEqual({
      role: Role.Api,
      queues: [],
    });
  });

  it('reads the worker queues', () => {
    const queues = [QueueName.RunsReactive, QueueName.Timers];

    const selection = parseServeArguments([
      cliArgument(CliOption.Role, Role.Worker),
      cliArgument(CliOption.Queues, queues.join(',')),
    ]);

    expect(selection).toEqual({ role: Role.Worker, queues });
  });

  it('rejects a missing role', () => {
    const issues = issuesOf(() => parseServeArguments([]));

    expect(variablesOf(issues)).toEqual([`--${CliOption.Role}`]);
  });

  it('rejects an unknown role', () => {
    const issues = issuesOf(() => parseServeArguments([cliArgument(CliOption.Role, 'unknown')]));

    expect(variablesOf(issues)).toEqual([`--${CliOption.Role}`]);
  });

  it('rejects a worker without queues', () => {
    const issues = issuesOf(() => parseServeArguments([cliArgument(CliOption.Role, Role.Worker)]));

    expect(variablesOf(issues)).toEqual([`--${CliOption.Queues}`]);
  });

  it('rejects an unknown queue', () => {
    const issues = issuesOf(() =>
      parseServeArguments([
        cliArgument(CliOption.Role, Role.Worker),
        cliArgument(CliOption.Queues, 'unknown'),
      ]),
    );

    expect(variablesOf(issues)).toHaveLength(1);
  });

  it('rejects an unknown command line option', () => {
    const issues = issuesOf(() =>
      parseServeArguments([cliArgument(CliOption.Role, Role.Api), '--unknown=1']),
    );

    expect(variablesOf(issues)).toEqual([CLI_ARGUMENTS_LABEL]);
  });
});

describe('parsePrintSchemaArguments', () => {
  it('reads the output path', () => {
    expect(parsePrintSchemaArguments([cliArgument(CliOption.Output, SCHEMA_OUTPUT)])).toEqual({
      output: SCHEMA_OUTPUT,
    });
  });

  it('rejects a missing output path', () => {
    const issues = issuesOf(() => parsePrintSchemaArguments([]));

    expect(variablesOf(issues)).toEqual([`--${CliOption.Output}`]);
  });
});
