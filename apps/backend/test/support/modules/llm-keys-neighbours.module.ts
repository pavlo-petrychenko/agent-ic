import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { FakeLlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.fake';
import { LlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.gateway';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class LlmKeysNeighboursModule extends defineModule({
  global: true,
  providers: [
    UsersRepository,
    FakeLlmModelListGateway,
    { provide: LlmModelListGateway, useExisting: FakeLlmModelListGateway },
  ],
  exports: [UsersRepository, FakeLlmModelListGateway, LlmModelListGateway],
}) {}
