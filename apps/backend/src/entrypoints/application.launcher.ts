import { BaseLauncher } from '@/entrypoints/base.launcher';
import { ConfigLoader } from '@/platform/config/config.loader';
import { TracingService } from '@/platform/observability/services/tracing.service';

export class ApplicationLauncher extends BaseLauncher {
  constructor(
    private readonly argv: readonly string[],
    private readonly configLoader: ConfigLoader = new ConfigLoader(),
  ) {
    super();
  }

  protected async run(): Promise<void> {
    const config = this.configLoader.load(this.argv);
    const tracing = new TracingService(config.telemetry);
    tracing.start();

    const { ApplicationFactory } = await import('@/entrypoints/application.factory');
    await new ApplicationFactory(config, tracing).start();
  }
}
