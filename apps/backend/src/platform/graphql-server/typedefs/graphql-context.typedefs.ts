import type { Request } from 'express';
import type { Context } from 'graphql-ws';
import type { Extra } from 'graphql-ws/use/ws';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { ConnectionParams } from '@/platform/graphql-server/typedefs/connection-param.typedefs';
import type { GraphqlLoaders } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

export interface GraphqlContext {
  readonly ctx: UseCaseCtx;
  readonly loaders: GraphqlLoaders;
}

export interface HttpContextInput {
  readonly req: Request;
}

export type WebSocketConnectionInput = Context<ConnectionParams>;

export type WebSocketContextInput = Context<ConnectionParams, Extra>;

export type GraphqlContextInput = HttpContextInput | WebSocketContextInput;
