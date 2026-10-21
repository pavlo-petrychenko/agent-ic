import { describe, expect, it } from 'vitest';
import {
  diffMigrationTags,
  readJournalTags,
  readMigrationFileTags,
} from '@test/support/helpers/migration-testing.helpers';

const FIRST_TAG = '0001_first';
const SECOND_TAG = '0002_second';
const ORPHAN_TAG = '0001_orphan';

describe('migration files', () => {
  it('match the journal tags with no orphan and no missing file', async () => {
    const mismatch = diffMigrationTags(await readMigrationFileTags(), await readJournalTags());

    expect(mismatch).toEqual({ orphanFiles: [], missingFiles: [] });
  });

  it('reports a file the journal does not list', () => {
    const mismatch = diffMigrationTags([FIRST_TAG, ORPHAN_TAG], [FIRST_TAG]);

    expect(mismatch).toEqual({ orphanFiles: [ORPHAN_TAG], missingFiles: [] });
  });

  it('reports a journal tag without a file', () => {
    const mismatch = diffMigrationTags([FIRST_TAG], [FIRST_TAG, SECOND_TAG]);

    expect(mismatch).toEqual({ orphanFiles: [], missingFiles: [SECOND_TAG] });
  });
});
