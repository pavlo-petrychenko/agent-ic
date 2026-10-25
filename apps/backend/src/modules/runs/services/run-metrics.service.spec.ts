import { NodeType } from '@agent-ic/flow';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConversationMode } from '@/modules/conversations';
import { RunMetricLabel, RunMetricName } from '@/modules/runs/constants/run-metrics.constants';
import { RunStatus, RunStepStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import { RunMetricsService } from '@/modules/runs/services/run-metrics.service';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import type { MetricsService } from '@/platform/observability/services/metrics.service';
import { createMetricsService, metricValue } from '@test/support/helpers/llm-testing.helpers';

const CREATED_AT = new Date('2026-01-01T00:00:00Z');
const WAIT_MS = 2_000;
const RUN_MS = 6_000;
const STEP_MS = 500;

const startedAt = new Date(CREATED_AT.getTime() + WAIT_MS);
const finishedAt = new Date(startedAt.getTime() + RUN_MS);

const finishLabels = (status: RunStatus): Record<string, string> => ({
  [RunMetricLabel.Mode]: ConversationMode.Simulation,
  [RunMetricLabel.Status]: status,
});

describe('RunMetricsService', () => {
  let metrics: MetricsService;
  let service: RunMetricsService;

  beforeEach(() => {
    metrics = createMetricsService();
    service = new RunMetricsService(metrics);
  });

  it('counts a created run by trigger and mode', async () => {
    service.runCreated({ trigger: RunTrigger.Message, mode: ConversationMode.Simulation });

    expect(
      await metricValue(metrics, RunMetricName.Created, {
        [RunMetricLabel.Trigger]: RunTrigger.Message,
        [RunMetricLabel.Mode]: ConversationMode.Simulation,
      }),
    ).toBe(1);
  });

  it('times how long a run waited before it started', async () => {
    service.runStarted({ mode: ConversationMode.Simulation, createdAt: CREATED_AT }, startedAt);

    expect(await metrics.render()).toContain(
      `${RunMetricName.QueueWait}_sum{role="api",mode="simulation"} ${WAIT_MS / MILLISECONDS_PER_SECOND}`,
    );
  });

  it('counts a finished run and times how long it ran', async () => {
    service.runFinished(
      { mode: ConversationMode.Simulation },
      RunStatus.Succeeded,
      startedAt,
      finishedAt,
    );

    expect(
      await metricValue(metrics, RunMetricName.Finished, finishLabels(RunStatus.Succeeded)),
    ).toBe(1);
    expect(await metrics.render()).toContain(
      `${RunMetricName.Duration}_sum{role="api",mode="simulation",status="succeeded"} ${RUN_MS / MILLISECONDS_PER_SECOND}`,
    );
  });

  it('counts a run that failed before it started without a duration', async () => {
    service.runFinished({ mode: ConversationMode.Live }, RunStatus.Failed, null, finishedAt);

    expect(
      await metricValue(metrics, RunMetricName.Finished, {
        [RunMetricLabel.Mode]: ConversationMode.Live,
        [RunMetricLabel.Status]: RunStatus.Failed,
      }),
    ).toBe(1);
    expect(await metrics.render()).not.toContain(
      `${RunMetricName.Duration}_sum{role="api",mode="live"`,
    );
  });

  it('counts a finished step by node type and times it', async () => {
    service.stepFinished(
      NodeType.Agent,
      RunStepStatus.Failed,
      startedAt,
      new Date(startedAt.getTime() + STEP_MS),
    );

    expect(
      await metricValue(metrics, RunMetricName.Steps, {
        [RunMetricLabel.NodeType]: NodeType.Agent,
        [RunMetricLabel.Status]: RunStepStatus.Failed,
      }),
    ).toBe(1);
    expect(await metrics.render()).toContain(
      `${RunMetricName.StepDuration}_sum{role="api",node_type="agent",status="failed"} ${STEP_MS / MILLISECONDS_PER_SECOND}`,
    );
  });
});
