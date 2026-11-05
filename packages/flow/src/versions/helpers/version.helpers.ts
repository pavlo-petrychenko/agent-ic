import type { z } from 'zod';
import { FLOW_SCHEMA_VERSION } from '@flow/document/constants/flow.constants';
import { flowDocumentSchema } from '@flow/document/schemas/flow.schema';
import {
  FIRST_SCHEMA_VERSION,
  ParseFlowFailureKind,
  SCHEMA_VERSION_FIELD,
  SECOND_SCHEMA_VERSION,
} from '@flow/versions/constants/version.constants';
import { upgradeFlowV1, upgradeFlowV2 } from '@flow/versions/helpers/upgrade.helpers';
import { flowV1DocumentSchema } from '@flow/versions/schemas/flow-v1.schema';
import { flowV2DocumentSchema } from '@flow/versions/schemas/flow-v2.schema';
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

const parseFirstVersion = (json: unknown): ParseFlowResult => {
  const result = flowV1DocumentSchema.safeParse(json);
  return result.success
    ? { ok: true, flow: upgradeFlowV2(upgradeFlowV1(result.data)) }
    : invalidDocument(result.error);
};

const parseSecondVersion = (json: unknown): ParseFlowResult => {
  const result = flowV2DocumentSchema.safeParse(json);
  return result.success
    ? { ok: true, flow: upgradeFlowV2(result.data) }
    : invalidDocument(result.error);
};

export const parseFlow = (json: unknown): ParseFlowResult => {
  const version = readVersion(json);
  if (version === FIRST_SCHEMA_VERSION) {
    return parseFirstVersion(json);
  }
  if (version === SECOND_SCHEMA_VERSION) {
    return parseSecondVersion(json);
  }
  if (version !== FLOW_SCHEMA_VERSION) {
    return { ok: false, failure: { kind: ParseFlowFailureKind.UnsupportedVersion, version } };
  }
  const result = flowDocumentSchema.safeParse(json);
  return result.success ? { ok: true, flow: result.data } : invalidDocument(result.error);
};
