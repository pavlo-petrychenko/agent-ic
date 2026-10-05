import { z } from 'zod';
import { NodeType } from '../../document/constants/flow.constants';
import { nodeBaseShape, templateSchema } from '../../document/schemas/node-base.schema';
import {
  API_REQUEST_MAX_TIMEOUT_SECONDS,
  HEADER_NAME_PATTERN,
  MAX_RETRIES,
} from '../../limits/constants/limit.constants';
import { recordIdSchema } from '../../references/schemas/record-id.schema';
import {
  FailureMode,
  HttpMethod,
  RequestAuthKind,
  RequestBodyKind,
} from '../constants/step.constants';

export const requestHeaderSchema = z.object({
  name: z.string().regex(HEADER_NAME_PATTERN),
  value: templateSchema,
});

export const requestBodySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(RequestBodyKind.None) }),
  z.object({ kind: z.literal(RequestBodyKind.Json), content: templateSchema }),
  z.object({ kind: z.literal(RequestBodyKind.Text), content: templateSchema }),
]);

export const requestAuthSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal(RequestAuthKind.None) }),
  z.object({ kind: z.literal(RequestAuthKind.Bearer), credentialId: recordIdSchema }),
]);

export const apiRequestConfigSchema = z.object({
  method: z.enum(HttpMethod),
  url: templateSchema,
  headers: z.array(requestHeaderSchema),
  body: requestBodySchema,
  auth: requestAuthSchema,
  timeoutSeconds: z.int().min(1).max(API_REQUEST_MAX_TIMEOUT_SECONDS),
  retries: z.int().min(0).max(MAX_RETRIES),
  onFailure: z.enum(FailureMode),
});

export const apiRequestNodeSchema = z.object({
  ...nodeBaseShape,
  type: z.literal(NodeType.ApiRequest),
  config: apiRequestConfigSchema,
});
