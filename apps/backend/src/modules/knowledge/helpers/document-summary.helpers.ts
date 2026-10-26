import {
  KNOWLEDGE_SUMMARY_CONTENT_SEPARATOR,
  KNOWLEDGE_SUMMARY_MAX_INPUT_TOKENS,
  KNOWLEDGE_SUMMARY_OUTLINE_PREFIX,
  KNOWLEDGE_SUMMARY_PROMPT_OVERHEAD_TOKENS,
  KNOWLEDGE_SUMMARY_TITLE_PREFIX,
  KNOWLEDGE_SUMMARY_TRUNCATED_MESSAGE,
  DocumentSummaryWarningCode,
} from '@/modules/knowledge/constants/knowledge-summary.constants';
import {
  textTokenCount,
  truncateTextToTokens,
} from '@/modules/knowledge/helpers/document-token.helpers';
import type { DocumentSection } from '@/modules/knowledge/typedefs/document-section.typedefs';
import type { DocumentSummaryContent } from '@/modules/knowledge/typedefs/document-summary.typedefs';

const headingOutline = (sections: readonly DocumentSection[]): string =>
  sections
    .filter((section) => section.heading !== null)
    .map((section) => section.path)
    .join('\n');

const contentParts = (parts: readonly string[]): string =>
  parts.filter((part) => part.length > 0).join(KNOWLEDGE_SUMMARY_CONTENT_SEPARATOR);

export const documentSummaryContent = (
  title: string,
  markdown: string,
  sections: readonly DocumentSection[],
  maxInputTokens = KNOWLEDGE_SUMMARY_MAX_INPUT_TOKENS,
): DocumentSummaryContent => {
  const titleLine = `${KNOWLEDGE_SUMMARY_TITLE_PREFIX}${title.trim()}`;
  const fullContent = contentParts([titleLine, markdown]);
  if (textTokenCount(fullContent) <= maxInputTokens) {
    return { content: fullContent, warnings: [] };
  }

  const outline = headingOutline(sections);
  const outlineBlock =
    outline.length === 0 ? '' : `${KNOWLEDGE_SUMMARY_OUTLINE_PREFIX}\n${outline}`;
  const budget =
    maxInputTokens -
    textTokenCount(titleLine) -
    textTokenCount(outlineBlock) -
    KNOWLEDGE_SUMMARY_PROMPT_OVERHEAD_TOKENS;
  return {
    content: contentParts([titleLine, truncateTextToTokens(markdown, budget), outlineBlock]),
    warnings: [
      {
        code: DocumentSummaryWarningCode.Truncated,
        message: KNOWLEDGE_SUMMARY_TRUNCATED_MESSAGE,
      },
    ],
  };
};
