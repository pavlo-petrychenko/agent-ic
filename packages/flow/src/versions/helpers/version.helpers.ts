import type { z } from 'zod';
import { FLOW_SCHEMA_VERSION } from '@flow/document/constants/flow.constants';
import { flowDocumentSchema } from '@flow/document/schemas/flow.schema';
import {
  ParseFlowFailureKind,
  SCHEMA_VERSION_FIELD,
} from '@flow/versions/constants/version.constants';
import type { FlowSchemaIssue, ParseFlowResult } from '@flow/versions/typedefs/version.typedefs';

const readVersion = (json: unknown): unknown =>
  typeof json === 'object' && json !== null && SCHEMA_VERSION_FIELD in json
    ? Reflect.get(json, SCHEMA_VERSION_FIELD)
    : null;

const invalidDocument = (error: z.ZodError): ParseFlowResult => {
  const issues: FlowSchemaIssue[] = error.issues.map((issue) => ({
    path: issue.path.map((segment) => (typeof segment === 'number' ? segment : String(segment))),
    code: issue.code,
    message: issue.message,
  }));
  return { ok: false, failure: { kind: ParseFlowFailureKind.InvalidDocument, issues } };
};

export const parseFlow = (json: unknown): ParseFlowResult => {
  const version = readVersion(json);
  if (version !== FLOW_SCHEMA_VERSION) {
    return { ok: false, failure: { kind: ParseFlowFailureKind.UnsupportedVersion, version } };
  }
  const result = flowDocumentSchema.safeParse(json);
  return result.success ? { ok: true, flow: result.data } : invalidDocument(result.error);
};
