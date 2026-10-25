import { OpenTelemetry } from '@ai-sdk/otel';
import { Inject, Injectable } from '@nestjs/common';
import { isSpanContextValid, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Attributes, Span, Tracer } from '@opentelemetry/api';
import type { TelemetryOptions } from 'ai';
import { ConfigService } from '@/platform/config/services/config.service';
import {
  LLM_TAGGED_SPAN,
  LLM_TELEMETRY_OFF,
  LLM_TRACER,
} from '@/platform/llm/constants/llm-tracing.constants';
import {
  langfuseObservationAttributes,
  langfuseTraceAttributes,
  llmCallAttributes,
  recordsLlmContent,
} from '@/platform/llm/helpers/llm-tracing.helpers';
import type { LlmCallTrace, LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';

@Injectable()
export class LlmTraceContextService {
  private readonly enabled: boolean;
  private readonly recordContent: boolean;

  constructor(
    config: ConfigService,
    @Inject(LLM_TRACER) private readonly tracer: Tracer,
  ) {
    this.enabled = config.config.telemetry.enabled;
    this.recordContent = recordsLlmContent(config.config);
  }

  async run<R>(tags: LlmTags, work: (traceId: string | null) => Promise<R>): Promise<R> {
    if (!this.enabled) {
      return work(null);
    }
    return this.inActiveSpan(tags.traceName, langfuseTraceAttributes(tags), work);
  }

  async span<R>(
    name: string,
    metadata: Readonly<Record<string, string>>,
    work: () => Promise<R>,
  ): Promise<R> {
    if (!this.enabled) {
      return work();
    }
    return this.inActiveSpan(name, langfuseObservationAttributes(metadata), () => work());
  }

  callTelemetry(tags: LlmTags, call: LlmCallTrace): TelemetryOptions {
    if (!this.enabled || trace.getActiveSpan()?.isRecording() === false) {
      return LLM_TELEMETRY_OFF;
    }
    const attributes = llmCallAttributes(tags, call);
    return {
      isEnabled: true,
      recordInputs: this.recordContent,
      recordOutputs: this.recordContent,
      functionId: tags.traceName,
      integrations: [
        new OpenTelemetry({
          tracer: this.tracer,
          enrichSpan: ({ spanType }) => (spanType === LLM_TAGGED_SPAN ? attributes : undefined),
        }),
      ],
    };
  }

  private inActiveSpan<R>(
    name: string,
    attributes: Attributes,
    work: (traceId: string | null) => Promise<R>,
  ): Promise<R> {
    return this.tracer.startActiveSpan(name, { attributes }, (span) => this.inSpan(span, work));
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
}
