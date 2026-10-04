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
    const { SchemaPrinter } = await import('@/platform/graphql/schema.printer');
    const schema = await new SchemaPrinter().print();
    await writeFile(output, `${schema}${EOL}`);
  }
}
