import { Injectable } from '@nestjs/common';
import { Gauge } from 'prom-client';
import {
  DatabaseMetricHelp,
  DatabaseMetricLabel,
  DatabaseMetricName,
  DatabasePool,
  DatabasePoolState,
} from '@/platform/database/constants/database-metrics.constants';
import { AppDatabaseService } from '@/platform/database/services/app-database.service';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class DatabaseMetricsService {
  constructor(
    metrics: MetricsService,
    private readonly app: AppDatabaseService,
    private readonly system: SystemDatabaseService,
  ) {
    const gauge: Gauge<DatabaseMetricLabel> = new Gauge({
      name: DatabaseMetricName.PoolConnections,
      help: DatabaseMetricHelp.PoolConnections,
      labelNames: [DatabaseMetricLabel.Pool, DatabaseMetricLabel.State],
      registers: [metrics.registry],
      collect: () => {
        this.report(gauge, DatabasePool.App, this.app);
        this.report(gauge, DatabasePool.System, this.system);
      },
    });
  }

  private report(
    gauge: Gauge<DatabaseMetricLabel>,
    pool: DatabasePool,
    client: AppDatabaseService | SystemDatabaseService,
  ): void {
    const stats = client.poolStats();
    const labels = { [DatabaseMetricLabel.Pool]: pool };
    gauge.set({ ...labels, [DatabaseMetricLabel.State]: DatabasePoolState.Total }, stats.total);
    gauge.set({ ...labels, [DatabaseMetricLabel.State]: DatabasePoolState.Idle }, stats.idle);
    gauge.set({ ...labels, [DatabaseMetricLabel.State]: DatabasePoolState.Waiting }, stats.waiting);
  }
}
