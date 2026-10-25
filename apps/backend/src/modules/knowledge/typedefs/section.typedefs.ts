import type { sections } from '@/modules/knowledge/db/sections.table';

export type Section = typeof sections.$inferSelect;

export type NewSection = Omit<typeof sections.$inferInsert, 'createdAt'>;

export type SectionChanges = Partial<Omit<NewSection, 'id' | 'workspaceId'>>;
