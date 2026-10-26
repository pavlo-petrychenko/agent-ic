import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_SUMMARY_CONTENT_SEPARATOR,
  KNOWLEDGE_SUMMARY_OUTLINE_PREFIX,
  KNOWLEDGE_SUMMARY_TITLE_PREFIX,
  KNOWLEDGE_SUMMARY_TRUNCATED_MESSAGE,
  DocumentSummaryWarningCode,
} from '@/modules/knowledge/constants/knowledge-summary.constants';
import { documentSummaryContent } from '@/modules/knowledge/helpers/document-summary.helpers';
import { buildDocumentSections } from '@/modules/knowledge/helpers/section-tree.helpers';

describe('documentSummaryContent', () => {
  it('sends the full Markdown when it fits', () => {
    const markdown = '# Pricing\n\nService prices.\n';
    const content = documentSummaryContent(
      'Handbook',
      markdown,
      buildDocumentSections(markdown),
      1_000,
    );

    expect(content).toEqual({
      content: `${KNOWLEDGE_SUMMARY_TITLE_PREFIX}Handbook${KNOWLEDGE_SUMMARY_CONTENT_SEPARATOR}${markdown}`,
      warnings: [],
    });
  });

  it('sends a prefix and the heading outline when the Markdown is too long', () => {
    const markdown = `# Pricing\n\n${'service prices '.repeat(200)}ENDMARKER\n\n## Gift cards\n\nGift cards.\n`;
    const content = documentSummaryContent(
      'Handbook',
      markdown,
      buildDocumentSections(markdown),
      20,
    );

    expect(content.content).toContain(`${KNOWLEDGE_SUMMARY_TITLE_PREFIX}Handbook`);
    expect(content.content).toContain(
      `${KNOWLEDGE_SUMMARY_OUTLINE_PREFIX}\nPricing\nPricing › Gift cards`,
    );
    expect(content.content).not.toContain('ENDMARKER');
    expect(content.warnings).toEqual([
      {
        code: DocumentSummaryWarningCode.Truncated,
        message: KNOWLEDGE_SUMMARY_TRUNCATED_MESSAGE,
      },
    ]);
  });
});
