import { FLOW_SCHEMA_VERSION } from '../document/flow.constants';
import { flowDocumentSchema } from '../document/flow.schema';
import { ParseFlowFailureKind, SCHEMA_VERSION_FIELD } from './version.constants';
import type { FlowSchemaIssue, ParseFlowResult } from './version.typedefs';

const readVersion = (json: unknown): unknown =>
  typeof json === 'object' && json !== null && SCHEMA_VERSION_FIELD in json
    ? Reflect.get(json, SCHEMA_VERSION_FIELD)
    : null;

export const parseFlow = (json: unknown): ParseFlowResult => {
  const version = readVersion(json);
  if (version !== FLOW_SCHEMA_VERSION) {
    return { ok: false, failure: { kind: ParseFlowFailureKind.UnsupportedVersion, version } };
  }
  const result = flowDocumentSchema.safeParse(json);
  if (result.success) {
    return { ok: true, flow: result.data };
  }
  const issues: FlowSchemaIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.map((segment) => (typeof segment === 'number' ? segment : String(segment))),
    code: issue.code,
    message: issue.message,
  }));
  return { ok: false, failure: { kind: ParseFlowFailureKind.InvalidDocument, issues } };
};
