import type {
  NodeTextKind,
  PathSegmentKind,
  TemplateErrorReason,
  TemplateSegmentKind,
} from '@flow/templates/constants/template.constants';

export type PathSegment =
  | { readonly kind: PathSegmentKind.Name; readonly name: string }
  | { readonly kind: PathSegmentKind.Index; readonly index: number };

export interface TemplateText {
  readonly kind: TemplateSegmentKind.Text;
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

export interface TemplateReference {
  readonly kind: TemplateSegmentKind.Reference;
  readonly path: string;
  readonly segments: readonly PathSegment[];
  readonly raw: string;
  readonly start: number;
  readonly end: number;
}

export interface TemplateInvalid {
  readonly kind: TemplateSegmentKind.Invalid;
  readonly reason: TemplateErrorReason;
  readonly raw: string;
  readonly start: number;
  readonly end: number;
}

export type TemplateSegment = TemplateText | TemplateReference | TemplateInvalid;

export type VariableResolver = (path: string) => unknown;

export interface NodeTextField {
  readonly kind: NodeTextKind;
  readonly path: readonly string[];
  readonly value: string;
}

export interface NodeTextMappers {
  readonly template: (text: string) => string;
  readonly variable: (path: string) => string;
}
