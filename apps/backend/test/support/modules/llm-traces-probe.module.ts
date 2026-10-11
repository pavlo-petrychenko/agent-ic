import { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import { createLlmTraceContextService } from '@test/support/helpers/llm-testing.helpers';

export class LlmTracesProbeModule extends defineModule({
  global: true,
  providers: [
    { provide: LlmTraceContextService, useFactory: () => createLlmTraceContextService({}) },
  ],
  exports: [LlmTraceContextService],
}) {}
