import type { Request } from 'express';
import type { Context } from 'graphql-ws';
import type { Extra } from 'graphql-ws/use/ws';

import type { UseCaseCtx } from '@/platform/context/use-case-ctx';

export interface GraphqlContext {
  readonly ctx: UseCaseCtx;
}

export type ConnectionParams = Readonly<Record<string, unknown>> | undefined;

export interface HttpContextInput {
  readonly req: Request;
}

export type WebSocketConnectionInput = Context<ConnectionParams>;

export type WebSocketContextInput = Context<ConnectionParams, Extra>;

export type GraphqlContextInput = HttpContextInput | WebSocketContextInput;
