import type { FlowDocument } from '../document/flow.typedefs';
import type { ParseFlowFailureKind } from './version.constants';

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
