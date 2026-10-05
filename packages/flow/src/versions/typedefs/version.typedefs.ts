import type { FlowDocument } from '../../document/typedefs/flow.typedefs';
import type { ParseFlowFailureKind } from '../constants/version.constants';

export interface FlowSchemaIssue {
  readonly path: readonly (string | number)[];
  readonly code: string;
  readonly message: string;
}

export type ParseFlowFailure =
  | { readonly kind: ParseFlowFailureKind.UnsupportedVersion; readonly version: unknown }
  | {
      readonly kind: ParseFlowFailureKind.InvalidDocument;
      readonly issues: readonly FlowSchemaIssue[];
    };

export type ParseFlowResult =
  | { readonly ok: true; readonly flow: FlowDocument }
  | { readonly ok: false; readonly failure: ParseFlowFailure };
