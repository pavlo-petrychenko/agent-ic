import { createParamDecorator } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { USE_CASE_CTX_CLS_KEY } from '@/platform/context/constants/authentication.constants';
import { MissingHttpCtxError } from '@/platform/context/errors/missing-http-ctx.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export const HttpCtx = createParamDecorator((): UseCaseCtx => {
  const ctx = ClsServiceManager.getClsService().get<UseCaseCtx | undefined>(USE_CASE_CTX_CLS_KEY);
  if (ctx === undefined) {
    throw new MissingHttpCtxError();
  }
  return ctx;
});
