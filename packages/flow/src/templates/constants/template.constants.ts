export enum TemplateSegmentKind {
  Text = 'text',
  Reference = 'reference',
  Invalid = 'invalid',
}

export enum TemplateErrorReason {
  Unclosed = 'unclosed',
  InvalidPath = 'invalid_path',
}

export enum PathSegmentKind {
  Name = 'name',
  Index = 'index',
}

export enum NodeTextKind {
  Template = 'template',
  Variable = 'variable',
}

export const TEMPLATE_OPEN = '{{';
export const TEMPLATE_CLOSE = '}}';
export const PATH_SEPARATOR = '.';
export const INDEX_OPEN = '[';
export const INDEX_CLOSE = ']';
export const PATH_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*/;
export const PATH_TAIL_PATTERN = /\.([A-Za-z_][A-Za-z0-9_]*)|\[(\d+)\]/y;
export const LEADING_WHITESPACE_PATTERN = /^\s*/;
export const EMPTY_TEXT = '';
