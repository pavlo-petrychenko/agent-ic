import { describe, expect, it } from 'vitest';
import { buildDocumentChunks } from '@/modules/knowledge/helpers/chunking.helpers';
import { contentHash } from '@/modules/knowledge/helpers/content-hash.helpers';
import { textTokenCount } from '@/modules/knowledge/helpers/document-token.helpers';
import { buildDocumentSections } from '@/modules/knowledge/helpers/section-tree.helpers';

const table = [
  '| Service | Price |',
  '| --- | --- |',
  '| Haircut | 20 |',
  '| Coloring | 50 |',
  '| Styling | 30 |',
].join('\n');

const largeTable = [
  '| Service | Price |',
  '| --- | --- |',
  ...Array.from({ length: 200 }, (_, index) => `| Service ${index} | ${index} |`),
].join('\n');

describe('buildDocumentChunks', () => {
  it('builds chunks for each section with global ordinals', () => {
    const sections = buildDocumentSections('Intro\n\n# A\n\nAlpha.\n\n# B\n\nBeta.\n');

    const chunks = buildDocumentChunks({ title: 'Handbook', sections });

    expect(chunks.map(({ sectionOrdinal, ordinal }) => ({ sectionOrdinal, ordinal }))).toEqual([
      { sectionOrdinal: 0, ordinal: 0 },
      { sectionOrdinal: 1, ordinal: 1 },
      { sectionOrdinal: 2, ordinal: 2 },
    ]);
    expect(chunks.map(({ content }) => content)).toEqual(['Intro', 'Alpha.', 'Beta.']);
    expect(chunks[0]?.indexText).toBe('Handbook\n\nIntro');
    expect(chunks[1]?.indexText).toBe('Handbook\n\nA\n\nAlpha.');
  });

  it('includes the section path and summary in index text', () => {
    const sections = buildDocumentSections('# Pricing\n\nService prices.\n');

    const [chunk] = buildDocumentChunks({
      title: 'Handbook',
      summary: 'Price list.',
      sections,
    });

    expect(chunk?.indexText).toBe('Handbook\n\nPricing\n\nPrice list.\n\nService prices.');
    expect(chunk?.contentHash).toBe(contentHash(chunk?.indexText ?? ''));
    expect(chunk?.tokenCount).toBe(textTokenCount('Service prices.'));
  });

  it('keeps a small document in one root chunk even above the normal maximum', () => {
    const content = Array.from({ length: 700 }, () => 'a').join(' ');
    const sections = buildDocumentSections(content);

    const chunks = buildDocumentChunks({ title: 'Note', sections });

    expect(textTokenCount(content)).toBe(700);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ sectionOrdinal: 0, ordinal: 0, content, tokenCount: 700 });
  });

  it('splits a long prose section and overlaps the next chunk at a sentence', () => {
    const sentences = Array.from(
      { length: 80 },
      (_, index) => `Sentence ${index + 1} ${'detail '.repeat(10)}.`,
    );
    const sections = buildDocumentSections(`# Long\n\n${sentences.join(' ')}\n`);

    const chunks = buildDocumentChunks({ title: 'Handbook', sections });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeLessThanOrEqual(600);
    }
    const first = chunks[0];
    const second = chunks[1];
    const lastSentence = first?.content.split(/(?<=\.)\s+/).at(-1) ?? '';
    expect(lastSentence.length).toBeGreaterThan(0);
    expect(second?.content).toContain(lastSentence);
  });

  it('keeps a table under the atomic limit in one chunk', () => {
    const sections = buildDocumentSections(`# Price list\n\n${table}\n`);

    const chunks = buildDocumentChunks({ title: 'Handbook', sections });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toBe(table);
  });

  it('splits a large table by rows and repeats its header', () => {
    const sections = buildDocumentSections(`# Catalog\n\n${largeTable}\n`);

    const chunks = buildDocumentChunks({ title: 'Handbook', sections });

    expect(chunks.length).toBeGreaterThan(1);
    const header = largeTable.split('\n').slice(0, 2).join('\n');
    for (const chunk of chunks) {
      expect(chunk.content.startsWith(header)).toBe(true);
      expect(chunk.tokenCount).toBeLessThanOrEqual(600);
    }
    const rows = chunks.reduce((total, chunk) => total + chunk.content.split('\n').length - 2, 0);
    expect(rows).toBe(200);
  });

  it('returns no chunks for an empty document', () => {
    expect(buildDocumentChunks({ title: 'Empty', sections: buildDocumentSections('') })).toEqual(
      [],
    );
  });
});
