import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { toModelOptions } from '@/modules/agents/helpers/model-option.helpers';
import type { ModelOption } from '@/modules/agents/typedefs/model-option.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { LLM_CATALOG, LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';

@Injectable()
export class ListModelOptionsUseCase {
  execute(ctx: UseCaseCtx): ModelOption[] {
    authorize(ctx, PermissionResource.Agents, PermissionAction.View);
    return toModelOptions(LLM_CATALOG, LLM_DEFAULT_MODEL);
  }
}
