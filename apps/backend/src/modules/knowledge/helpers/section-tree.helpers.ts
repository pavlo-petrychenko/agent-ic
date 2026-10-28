import type { Heading, RootContent } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString } from 'mdast-util-to-string';
import {
  KNOWLEDGE_SECTION_BREADCRUMB_SEPARATOR,
  KNOWLEDGE_SECTION_ROOT_LEVEL,
  KNOWLEDGE_SECTION_ROOT_PATH,
} from '@/modules/knowledge/constants/knowledge-section.constants';
import { canonicalizeMarkdown } from '@/modules/knowledge/helpers/canonical-markdown.helpers';
import { contentHash } from '@/modules/knowledge/helpers/content-hash.helpers';
import { textTokenCount } from '@/modules/knowledge/helpers/document-token.helpers';
import type { DocumentSection } from '@/modules/knowledge/typedefs/document-section.typedefs';

const ATX_HEADING_PATTERN = /^ {0,3}(#{1,6})(?:\s|$)/;
const LEADING_BLANK_LINES_PATTERN = /^(?:[ \t]*\n)+/;

const isHeading = (node: RootContent): node is Heading => node.type === 'heading';

const isAtxHeading = (markdown: string, heading: Heading): boolean => {
  const start = heading.position?.start.offset;
  if (start === undefined) {
    return false;
  }
  const lineStart = markdown.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = markdown.indexOf('\n', start);
  const line = markdown.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  const match = ATX_HEADING_PATTERN.exec(line);
  return match?.[1]?.length === heading.depth;
};

const sectionContent = (markdown: string, start: number, end: number): string =>
  canonicalizeMarkdown(markdown.slice(start, end).replace(LEADING_BLANK_LINES_PATTERN, ''));

const section = (
  markdown: string,
  ordinal: number,
  level: number,
  path: string,
  heading: string | null,
  start: number,
  end: number,
): DocumentSection => {
  const content = sectionContent(markdown, start, end);
  return {
    ordinal,
    level,
    path,
    heading,
    content,
    tokenCount: textTokenCount(content),
    contentHash: contentHash(content),
  };
};

export const buildDocumentSections = (markdown: string): DocumentSection[] => {
  const headings = fromMarkdown(markdown)
    .children.filter(isHeading)
    .filter((heading) => isAtxHeading(markdown, heading));
  const sections: DocumentSection[] = [];
  const rootEnd = headings[0]?.position?.start.offset ?? markdown.length;
  sections.push(
    section(
      markdown,
      0,
      KNOWLEDGE_SECTION_ROOT_LEVEL,
      KNOWLEDGE_SECTION_ROOT_PATH,
      null,
      0,
      rootEnd,
    ),
  );

  const ancestors: Heading[] = [];
  headings.forEach((heading, index) => {
    while ((ancestors.at(-1)?.depth ?? 0) >= heading.depth) {
      ancestors.pop();
    }
    ancestors.push(heading);
    const text = toString(heading).trim();
    const start = heading.position?.end.offset ?? markdown.length;
    const end = headings[index + 1]?.position?.start.offset ?? markdown.length;
    sections.push(
      section(
        markdown,
        sections.length,
        heading.depth,
        ancestors
          .map((ancestor) => toString(ancestor).trim())
          .join(KNOWLEDGE_SECTION_BREADCRUMB_SEPARATOR),
        text,
        start,
        end,
      ),
    );
  });

  return sections;
};
