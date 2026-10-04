import { writeFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { BaseLauncher } from '@/entrypoints/base.launcher';
import { ConfigLoader } from '@/platform/config/config.loader';
import { printMergedSchema } from '@/platform/graphql-server/helpers/schema-print.helpers';

export class SchemaPrintLauncher extends BaseLauncher {
  constructor(
    private readonly argv: readonly string[],
    private readonly configLoader: ConfigLoader = new ConfigLoader(),
  ) {
    super();
  }

  protected async run(): Promise<void> {
    const config = this.configLoader.loadSchemaPrint(this.argv);
    const schema = await printMergedSchema();
    await writeFile(config.output, `${schema}${EOL}`);
  }
}
