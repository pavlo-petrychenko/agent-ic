import { BaseCommand } from '@/app/commands/base.command';
import { parseServeArguments } from '@/app/helpers/command-line.helpers';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { TracingService } from '@/platform/observability/tracing/tracing.service';

export class ServeCommand extends BaseCommand {
  constructor(private readonly args: readonly string[]) {
    super();
  }

  protected async run(): Promise<void> {
    const config = loadAppConfig(parseServeArguments(this.args));
    const tracing = new TracingService(config.telemetry);
    tracing.start();

    const { AppModule } = await import('@/app/app.module');
    const { createApplication, startApplication } =
      await import('@/app/helpers/application.helpers');
    await startApplication(
      config,
      await createApplication(config, AppModule.forRole(config, tracing)),
    );
  }
}
