import {
  EMPTY_TEXT,
  TEMPLATE_CLOSE,
  TEMPLATE_OPEN,
  TemplateErrorReason,
  TemplateSegmentKind,
} from '@flow/templates/constants/template.constants';
import { formatVariablePath, parseVariablePath } from '@flow/templates/helpers/path.helpers';
import type {
  TemplateReference,
  TemplateSegment,
  VariableResolver,
} from '@flow/templates/typedefs/template.typedefs';

const textSegment = (text: string, start: number, end: number): TemplateSegment[] =>
  end > start ? [{ kind: TemplateSegmentKind.Text, text: text.slice(start, end), start, end }] : [];

const tagSegment = (text: string, start: number, end: number): TemplateSegment => {
  const raw = text.slice(start, end);
  const inner = text.slice(start + TEMPLATE_OPEN.length, end - TEMPLATE_CLOSE.length);
  const segments = parseVariablePath(inner);
  if (segments === null) {
    return {
      kind: TemplateSegmentKind.Invalid,
      reason: TemplateErrorReason.InvalidPath,
      raw,
      start,
      end,
    };
  }
  return {
    kind: TemplateSegmentKind.Reference,
    path: formatVariablePath(segments),
    segments,
    raw,
    start,
    end,
  };
};

export const parseTemplate = (text: string): readonly TemplateSegment[] => {
  const segments: TemplateSegment[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const open = text.indexOf(TEMPLATE_OPEN, cursor);
    if (open === -1) {
      break;
    }
    const close = text.indexOf(TEMPLATE_CLOSE, open + TEMPLATE_OPEN.length);
    segments.push(...textSegment(text, cursor, open));
    if (close === -1) {
      segments.push({
        kind: TemplateSegmentKind.Invalid,
        reason: TemplateErrorReason.Unclosed,
        raw: text.slice(open),
        start: open,
        end: text.length,
      });
      return segments;
    }
    const end = close + TEMPLATE_CLOSE.length;
    segments.push(tagSegment(text, open, end));
    cursor = end;
  }
  segments.push(...textSegment(text, cursor, text.length));
  return segments;
};

export const templateReferences = (text: string): readonly TemplateReference[] =>
  parseTemplate(text).filter(
    (segment): segment is TemplateReference => segment.kind === TemplateSegmentKind.Reference,
  );

export const formatTemplateValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return EMPTY_TEXT;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
};

export const renderTemplate = (text: string, resolve: VariableResolver): string =>
  parseTemplate(text)
    .map((segment) => {
      switch (segment.kind) {
        case TemplateSegmentKind.Text:
          return segment.text;
        case TemplateSegmentKind.Reference:
          return formatTemplateValue(resolve(segment.path));
        case TemplateSegmentKind.Invalid:
          return segment.raw;
      }
    })
    .join(EMPTY_TEXT);
