import { describe, expect, it } from 'vitest';
import { contentHash } from '@/modules/knowledge/helpers/content-hash.helpers';
import { buildDocumentSections } from '@/modules/knowledge/helpers/section-tree.helpers';

describe('buildDocumentSections', () => {
  it('builds the root and heading sections with breadcrumbs', () => {
    const sections = buildDocumentSections(
      'Intro\n\n' +
        '# Pricing\n\n' +
        'Service prices.\n\n' +
        '## Gift cards\n\n' +
        'Gift cards are available.\n\n' +
        '## Refunds\n\n' +
        'Refund rules.\n\n' +
        '# Contact\n\n' +
        'Email us.\n',
    );

    expect(sections).toMatchObject([
      {
        ordinal: 0,
        level: 1,
        path: '',
        heading: null,
        content: 'Intro\n',
      },
      {
        ordinal: 1,
        level: 1,
        path: 'Pricing',
        heading: 'Pricing',
        content: 'Service prices.\n',
      },
      {
        ordinal: 2,
        level: 2,
        path: 'Pricing › Gift cards',
        heading: 'Gift cards',
        content: 'Gift cards are available.\n',
      },
      {
        ordinal: 3,
        level: 2,
        path: 'Pricing › Refunds',
        heading: 'Refunds',
        content: 'Refund rules.\n',
      },
      {
        ordinal: 4,
        level: 1,
        path: 'Contact',
        heading: 'Contact',
        content: 'Email us.\n',
      },
    ]);
    for (const section of sections) {
      expect(section.contentHash).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(sections[0]?.tokenCount).toBeGreaterThan(0);
    expect(sections[1]?.tokenCount).toBeGreaterThan(0);
  });

  it('pops ancestors when the heading level rises', () => {
    const sections = buildDocumentSections('# A\n\na\n\n### A3\n\na3\n\n## A2\n\na2\n\n# B\n\nb\n');

    expect(sections.map(({ level, path }) => ({ level, path }))).toEqual([
      { level: 1, path: '' },
      { level: 1, path: 'A' },
      { level: 3, path: 'A › A3' },
      { level: 2, path: 'A › A2' },
      { level: 1, path: 'B' },
    ]);
  });

  it('keeps an empty root when the document starts with a heading', () => {
    const [root] = buildDocumentSections('# Pricing\n\nService prices.\n');

    expect(root).toMatchObject({
      ordinal: 0,
      heading: null,
      content: '',
      tokenCount: 0,
      contentHash: contentHash(''),
    });
  });

  it('ignores setext headings', () => {
    const sections = buildDocumentSections('Pricing\n=======\n\nService prices.\n');

    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({
      heading: null,
      content: 'Pricing\n=======\n\nService prices.\n',
    });
  });

  it('ignores headings inside fenced code and blockquotes', () => {
    const sections = buildDocumentSections(
      '```\n# Not a heading\n```\n\n> # Not a heading\n\n# Real heading\n\nBody\n',
    );

    expect(sections.map(({ heading }) => heading)).toEqual([null, 'Real heading']);
  });

  it('keeps a document without headings as one root section', () => {
    const sections = buildDocumentSections('Pricing\n\nService prices.\n');

    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({
      ordinal: 0,
      path: '',
      heading: null,
      content: 'Pricing\n\nService prices.\n',
    });
  });

  it('returns an empty root for empty Markdown', () => {
    expect(buildDocumentSections('')).toEqual([
      {
        ordinal: 0,
        level: 1,
        path: '',
        heading: null,
        content: '',
        tokenCount: 0,
        contentHash: contentHash(''),
      },
    ]);
  });
});
