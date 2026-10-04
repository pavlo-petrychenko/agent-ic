import { writeFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { BaseLauncher } from '@/entrypoints/base.launcher';
import { ConfigLoader } from '@/platform/config/config.loader';
import { SchemaPrinter } from '@/platform/graphql/schema.printer';

export class SchemaPrintLauncher extends BaseLauncher {
  constructor(
    private readonly argv: readonly string[],
    private readonly configLoader: ConfigLoader = new ConfigLoader(),
    private readonly printer: SchemaPrinter = new SchemaPrinter(),
  ) {
    super();
  }

  protected async run(): Promise<void> {
    const config = this.configLoader.loadSchemaPrint(this.argv);
    const schema = await this.printer.print();
    await writeFile(config.output, `${schema}${EOL}`);
  }
}
