import { describe, expect, it } from 'vitest';
import { buildDocumentChunks } from '@/modules/knowledge/helpers/chunking.helpers';
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

    const chunks = buildDocumentChunks(sections);

    expect(chunks.map(({ sectionOrdinal, ordinal }) => ({ sectionOrdinal, ordinal }))).toEqual([
      { sectionOrdinal: 0, ordinal: 0 },
      { sectionOrdinal: 1, ordinal: 1 },
      { sectionOrdinal: 2, ordinal: 2 },
    ]);
    expect(chunks.map(({ content }) => content)).toEqual(['Intro', 'Alpha.', 'Beta.']);
    expect(chunks[0]?.tokenCount).toBe(textTokenCount('Intro'));
  });

  it('keeps a small document in one root chunk even above the normal maximum', () => {
    const content = Array.from({ length: 700 }, () => 'a').join(' ');
    const sections = buildDocumentSections(content);

    const chunks = buildDocumentChunks(sections);

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

    const chunks = buildDocumentChunks(sections);

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

    const chunks = buildDocumentChunks(sections);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toBe(table);
  });

  it('splits a large table by rows and repeats its header', () => {
    const sections = buildDocumentSections(`# Catalog\n\n${largeTable}\n`);

    const chunks = buildDocumentChunks(sections);

    expect(chunks.length).toBeGreaterThan(1);
    const header = largeTable.split('\n').slice(0, 2).join('\n');
    for (const chunk of chunks) {
      expect(chunk.content.startsWith(header)).toBe(true);
      expect(chunk.tokenCount).toBeLessThanOrEqual(600);
    }
    const rows = chunks.reduce((total, chunk) => total + chunk.content.split('\n').length - 2, 0);
    expect(rows).toBe(200);
  });

  it('splits a single word that is longer than the chunk limit', () => {
    const content = 'abcdefghij'.repeat(500);
    const sections = buildDocumentSections(content);

    const chunks = buildDocumentChunks(sections);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeLessThanOrEqual(600);
    }
    expect(chunks.map(({ content: chunk }) => chunk).join('')).toBe(content);
  });

  it('splits a table row that alone exceeds the chunk limit', () => {
    const hugeRow = `| Service | ${'x'.repeat(10_000)} |`;
    const hugeTable = ['| Service | Price |', '| --- | --- |', hugeRow].join('\n');
    const sections = buildDocumentSections(`# Catalog\n\n${hugeTable}\n`);

    const chunks = buildDocumentChunks(sections);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeLessThanOrEqual(600);
    }
  });

  it('returns no chunks for an empty document', () => {
    expect(buildDocumentChunks(buildDocumentSections(''))).toEqual([]);
  });
});
