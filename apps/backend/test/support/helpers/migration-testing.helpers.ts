import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { CLIENT_CLOSE_TIMEOUT_SECONDS } from '@/platform/database/constants/database-client.constants';
import { DatabaseRole } from '@/platform/database/constants/database.constants';
import {
  MIGRATION_POOL_SIZE,
  MIGRATIONS_FOLDER,
  MIGRATIONS_SCHEMA,
  MIGRATIONS_TABLE,
} from '@/platform/database/constants/migration.constants';
import { createSqlClient } from '@/platform/database/helpers/sql-client.helpers';
import { URL_PATH_SEPARATOR } from '@/platform/http/constants/url.constants';
import {
  MIGRATION_FILE_EXTENSION,
  MIGRATION_JOURNAL_PATH,
  MIGRATIONS_COPY_PREFIX,
} from '@test/support/constants/migration-testing.constants';
import { SCRATCH_POOL_SIZE } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { discardNotice } from '@test/support/helpers/test-infrastructure.helpers';
import type {
  MigrationFileMismatch,
  MigrationJournal,
} from '@test/support/typedefs/migration-testing.typedefs';

export const databaseUrlFor = (url: string, database: string): string => {
  const target = new URL(url);
  target.pathname = `${URL_PATH_SEPARATOR}${database}`;
  return target.toString();
};

export const createOwnedDatabase = async (
  superuserUrl: string,
  database: string,
): Promise<void> => {
  const client = createSqlClient({ url: superuserUrl, poolMax: SCRATCH_POOL_SIZE }, discardNotice);
  try {
    await drizzle({ client }).execute(
      sql`create database ${sql.identifier(database)} owner ${sql.identifier(DatabaseRole.Owner)}`,
    );
  } finally {
    await client.end({ timeout: CLIENT_CLOSE_TIMEOUT_SECONDS });
  }
};

export const dropDatabase = async (superuserUrl: string, database: string): Promise<void> => {
  const client = createSqlClient({ url: superuserUrl, poolMax: SCRATCH_POOL_SIZE }, discardNotice);
  try {
    await drizzle({ client }).execute(
      sql`drop database if exists ${sql.identifier(database)} with (force)`,
    );
  } finally {
    await client.end({ timeout: CLIENT_CLOSE_TIMEOUT_SECONDS });
  }
};

const readMigrationJournal = async (): Promise<MigrationJournal> => {
  const journalText = await readFile(join(MIGRATIONS_FOLDER, MIGRATION_JOURNAL_PATH), 'utf8');
  return JSON.parse(journalText) as MigrationJournal;
};

export const readJournalTags = async (): Promise<string[]> => {
  const journal = await readMigrationJournal();
  return journal.entries.map((entry) => entry.tag);
};

export const readMigrationFileTags = async (): Promise<string[]> => {
  const names = await readdir(MIGRATIONS_FOLDER);
  return names
    .filter((name) => name.endsWith(MIGRATION_FILE_EXTENSION))
    .map((name) => name.slice(0, -MIGRATION_FILE_EXTENSION.length));
};

export const diffMigrationTags = (
  fileTags: readonly string[],
  journalTags: readonly string[],
): MigrationFileMismatch => ({
  orphanFiles: fileTags.filter((tag) => !journalTags.includes(tag)).sort(),
  missingFiles: journalTags.filter((tag) => !fileTags.includes(tag)).sort(),
});

const copyMigrationsThrough = async (lastTag: string): Promise<string> => {
  const journal = await readMigrationJournal();
  const last = journal.entries.findIndex((entry) => entry.tag === lastTag);
  if (last < 0) {
    throw new MissingTestDataError(lastTag);
  }
  const entries = journal.entries.slice(0, last + 1);
  const folder = await mkdtemp(join(tmpdir(), MIGRATIONS_COPY_PREFIX));
  const journalPath = join(folder, MIGRATION_JOURNAL_PATH);
  await mkdir(dirname(journalPath), { recursive: true });
  await writeFile(journalPath, JSON.stringify({ ...journal, entries }));
  for (const { tag } of entries) {
    const file = `${tag}${MIGRATION_FILE_EXTENSION}`;
    await copyFile(join(MIGRATIONS_FOLDER, file), join(folder, file));
  }
  return folder;
};

const migrateFrom = async (ownerUrl: string, migrationsFolder: string): Promise<void> => {
  const client = createSqlClient({ url: ownerUrl, poolMax: MIGRATION_POOL_SIZE }, discardNotice);
  try {
    await migrate(drizzle({ client }), {
      migrationsFolder,
      migrationsSchema: MIGRATIONS_SCHEMA,
      migrationsTable: MIGRATIONS_TABLE,
    });
  } finally {
    await client.end({ timeout: CLIENT_CLOSE_TIMEOUT_SECONDS });
  }
};

export const migrateThrough = async (ownerUrl: string, lastTag: string): Promise<void> => {
  const folder = await copyMigrationsThrough(lastTag);
  try {
    await migrateFrom(ownerUrl, folder);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
};
