import { writeFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { BaseCommand } from '@/app/commands/base.command';
import { parsePrintSchemaArguments } from '@/app/helpers/command-line.helpers';

export class PrintSchemaCommand extends BaseCommand {
  constructor(private readonly args: readonly string[]) {
    super();
  }

  protected async run(): Promise<void> {
    const { output } = parsePrintSchemaArguments(this.args);
    const { printMergedSchema } =
      await import('@/platform/graphql-server/helpers/schema-print.helpers');
    const schema = await printMergedSchema();
    await writeFile(output, `${schema}${EOL}`);
  }
}
