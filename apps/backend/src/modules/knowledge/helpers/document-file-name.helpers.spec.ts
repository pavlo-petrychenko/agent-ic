import { describe, expect, it } from 'vitest';
import { documentFileName } from '@/modules/knowledge/helpers/document-file-name.helpers';

describe('documentFileName', () => {
  it('splits a plain file name', () => {
    expect(documentFileName('Pricing 2026.pdf')).toEqual({
      baseName: 'Pricing 2026.pdf',
      extension: '.pdf',
      stem: 'Pricing 2026',
    });
  });

  it('removes a Windows directory and lowercases the extension', () => {
    expect(documentFileName('C:\\documents\\GUIDE.MD')).toEqual({
      baseName: 'GUIDE.MD',
      extension: '.md',
      stem: 'GUIDE',
    });
  });

  it('keeps a file name without an extension', () => {
    expect(documentFileName('guide')).toEqual({
      baseName: 'guide',
      extension: '',
      stem: 'guide',
    });
  });

  it('removes only the last extension', () => {
    expect(documentFileName('archive.tar.gz').stem).toBe('archive.tar');
  });
});
