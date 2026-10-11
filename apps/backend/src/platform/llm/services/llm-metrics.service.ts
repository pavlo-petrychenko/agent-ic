import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import {
  LLM_CALL_DURATION_BUCKETS_SECONDS,
  LlmCallOutcome,
  LlmMetricHelp,
  LlmMetricLabel,
  LlmMetricName,
} from '@/platform/llm/constants/llm-metrics.constants';
import type { LlmOperation } from '@/platform/llm/constants/llm-metrics.constants';
import type { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class LlmMetricsService {
  private readonly calls: Counter<LlmMetricLabel>;
  private readonly callDuration: Histogram<LlmMetricLabel>;
  private readonly fallbacks: Counter<LlmMetricLabel>;
  private readonly outputRetries: Counter<LlmMetricLabel>;
  private readonly replyNudges: Counter<LlmMetricLabel>;

  constructor(
    metrics: MetricsService,
    private readonly clock: ClockService,
  ) {
    const registers = [metrics.registry];
    const callLabels = [LlmMetricLabel.Operation, LlmMetricLabel.Model, LlmMetricLabel.Outcome];
    this.calls = new Counter({
      name: LlmMetricName.Calls,
      help: LlmMetricHelp.Calls,
      labelNames: callLabels,
      registers,
    });
    this.callDuration = new Histogram({
      name: LlmMetricName.CallDuration,
      help: LlmMetricHelp.CallDuration,
      labelNames: callLabels,
      buckets: [...LLM_CALL_DURATION_BUCKETS_SECONDS],
      registers,
    });
    this.fallbacks = new Counter({
      name: LlmMetricName.Fallbacks,
      help: LlmMetricHelp.Fallbacks,
      labelNames: [LlmMetricLabel.Model, LlmMetricLabel.Fallback],
      registers,
    });
    this.outputRetries = new Counter({
      name: LlmMetricName.OutputRetries,
      help: LlmMetricHelp.OutputRetries,
      labelNames: [LlmMetricLabel.Model],
      registers,
    });
    this.replyNudges = new Counter({
      name: LlmMetricName.ReplyNudges,
      help: LlmMetricHelp.ReplyNudges,
      labelNames: [LlmMetricLabel.Model],
      registers,
    });
  }

  async measure<R>(operation: LlmOperation, model: LlmModelId, call: () => Promise<R>): Promise<R> {
    const startedAt = this.clock.now().getTime();
    let outcome = LlmCallOutcome.Failed;
    try {
      const result = await call();
      outcome = LlmCallOutcome.Answered;
      return result;
    } finally {
      const labels = {
        [LlmMetricLabel.Operation]: operation,
        [LlmMetricLabel.Model]: model,
        [LlmMetricLabel.Outcome]: outcome,
      };
      this.calls.inc(labels);
      this.callDuration.observe(
        labels,
        (this.clock.now().getTime() - startedAt) / MILLISECONDS_PER_SECOND,
      );
    }
  }

  fallback(model: LlmModelId, fallback: LlmModelId): void {
    this.fallbacks.inc({ [LlmMetricLabel.Model]: model, [LlmMetricLabel.Fallback]: fallback });
  }

  outputRetry(model: LlmModelId): void {
    this.outputRetries.inc({ [LlmMetricLabel.Model]: model });
  }

  replyNudge(model: LlmModelId): void {
    this.replyNudges.inc({ [LlmMetricLabel.Model]: model });
  }
}
