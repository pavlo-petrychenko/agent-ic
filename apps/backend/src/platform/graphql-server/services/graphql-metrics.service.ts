import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram } from 'prom-client';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import {
  GraphqlMetricHelp,
  GraphqlMetricLabel,
  GraphqlMetricName,
} from '@/platform/graphql-server/constants/graphql-metrics.constants';
import type { GraphqlOperationSample } from '@/platform/graphql-server/typedefs/graphql-metrics.typedefs';
import { LATENCY_BUCKETS_SECONDS } from '@/platform/observability/constants/metrics.constants';
import {
  activeExemplarLabels,
  observeWithExemplar,
} from '@/platform/observability/helpers/exemplar.helpers';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class GraphqlMetricsService {
  private readonly operations: Counter<GraphqlMetricLabel>;
  private readonly operationDuration: Histogram<GraphqlMetricLabel>;
  private readonly wsConnections: Gauge;

  constructor(
    metrics: MetricsService,
    private readonly clock: ClockService,
  ) {
    const registers = [metrics.registry];
    const labelNames = [
      GraphqlMetricLabel.Type,
      GraphqlMetricLabel.RootField,
      GraphqlMetricLabel.Outcome,
    ];
    this.operations = new Counter({
      name: GraphqlMetricName.Operations,
      help: GraphqlMetricHelp.Operations,
      labelNames,
      registers,
    });
    this.operationDuration = new Histogram({
      name: GraphqlMetricName.OperationDuration,
      help: GraphqlMetricHelp.OperationDuration,
      labelNames,
      buckets: [...LATENCY_BUCKETS_SECONDS],
      enableExemplars: true,
      registers,
    });
    this.wsConnections = new Gauge({
      name: GraphqlMetricName.WsConnections,
      help: GraphqlMetricHelp.WsConnections,
      registers,
    });
  }

  now(): number {
    return this.clock.now().getTime();
  }

  record(sample: GraphqlOperationSample): void {
    const labels = {
      [GraphqlMetricLabel.Type]: sample.type,
      [GraphqlMetricLabel.RootField]: sample.rootField,
      [GraphqlMetricLabel.Outcome]: sample.outcome,
    };
    this.operations.inc(labels);
    observeWithExemplar(
      this.operationDuration,
      labels,
      (this.now() - sample.startedAt) / MILLISECONDS_PER_SECOND,
      activeExemplarLabels(),
    );
  }

  connectionOpened(): void {
    this.wsConnections.inc();
  }

  connectionClosed(): void {
    this.wsConnections.dec();
  }
}
