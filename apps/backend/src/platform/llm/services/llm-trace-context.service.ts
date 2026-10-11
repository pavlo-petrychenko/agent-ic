import { OpenTelemetry } from '@ai-sdk/otel';
import { Inject, Injectable } from '@nestjs/common';
import { context, isSpanContextValid, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Tracer } from '@opentelemetry/api';
import type { TelemetryOptions } from 'ai';
import { ConfigService } from '@/platform/config/services/config.service';
import {
  LLM_TAGGED_SPAN,
  LLM_TELEMETRY_OFF,
  LLM_TRACE_SAMPLED,
  LLM_TRACER,
} from '@/platform/llm/constants/llm-tracing.constants';
import {
  langfuseTraceAttributes,
  llmCallAttributes,
  traceSampleRate,
} from '@/platform/llm/helpers/llm-tracing.helpers';
import { LlmSamplerService } from '@/platform/llm/services/llm-sampler.service';
import type { LlmCallTrace, LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';

@Injectable()
export class LlmTraceContextService {
  private readonly sampleRate: number | null;

  constructor(
    config: ConfigService,
    private readonly sampler: LlmSamplerService,
    @Inject(LLM_TRACER) private readonly tracer: Tracer,
  ) {
    this.sampleRate = traceSampleRate(config.config);
  }

  async run<R>(tags: LlmTags, work: (traceId: string | null) => Promise<R>): Promise<R> {
    if (!this.decide()) {
      return context.with(context.active().setValue(LLM_TRACE_SAMPLED, false), () => work(null));
    }
    return this.tracer.startActiveSpan(
      tags.traceName,
      { root: true, attributes: langfuseTraceAttributes(tags) },
      context.active().setValue(LLM_TRACE_SAMPLED, true),
      (span) => this.inSpan(span, work),
    );
  }

  async forCall<R>(work: () => Promise<R>): Promise<R> {
    if (typeof context.active().getValue(LLM_TRACE_SAMPLED) === 'boolean') {
      return work();
    }
    return context.with(context.active().setValue(LLM_TRACE_SAMPLED, this.decide()), work);
  }

  callTelemetry(tags: LlmTags, call: LlmCallTrace): TelemetryOptions {
    if (this.sampleRate === null || context.active().getValue(LLM_TRACE_SAMPLED) !== true) {
      return LLM_TELEMETRY_OFF;
    }
    const attributes = llmCallAttributes(tags, call);
    return {
      isEnabled: true,
      functionId: tags.traceName,
      integrations: [
        new OpenTelemetry({
          tracer: this.tracer,
          enrichSpan: ({ spanType }) => (spanType === LLM_TAGGED_SPAN ? attributes : undefined),
        }),
      ],
    };
  }

  private async inSpan<R>(span: Span, work: (traceId: string | null) => Promise<R>): Promise<R> {
    const spanContext = span.spanContext();
    const recorded = isSpanContextValid(spanContext) && span.isRecording();
    try {
      return await work(recorded ? spanContext.traceId : null);
    } catch (error) {
      span.recordException(error instanceof Error ? error : String(error));
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }

  private decide(): boolean {
    return this.sampleRate !== null && this.sampler.sample(this.sampleRate);
  }
}
