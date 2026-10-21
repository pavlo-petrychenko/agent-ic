import { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import { RecordingLlmKeyResolver } from '@test/support/fakes/recording-llm-key-resolver.fake';

export class LlmNeighboursModule extends defineModule({
  global: true,
  providers: [{ provide: LlmKeyResolver, useClass: RecordingLlmKeyResolver }],
  exports: [LlmKeyResolver],
}) {}
