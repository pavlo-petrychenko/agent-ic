import { describe, expect, it } from 'vitest';
import { toPromptGroups } from '@/features/prompts/logic/helpers/promptTree.helpers';
import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

const QA_FOLDER: PromptFolderListItem = { id: 'pfl_qa', name: 'Q&A' };
const GUARDS_FOLDER: PromptFolderListItem = { id: 'pfl_guards', name: 'Guards & tags' };

const prompt = (id: string, name: string, folderId: string): PromptListItem => ({
  id,
  name,
  folderId,
  latestVersionNumber: null,
  updatedAt: '2026-10-01T00:00:00.000Z',
});

const RECEPTIONIST = prompt('prm_receptionist', 'Receptionist', QA_FOLDER.id);
const GIFT_CARD = prompt('prm_gift_card', 'Gift card answers', QA_FOLDER.id);
const CONVERSATION_GUARD = prompt('prm_conversation_guard', 'Conversation guard', GUARDS_FOLDER.id);

const folders = [QA_FOLDER, GUARDS_FOLDER];
const prompts = [RECEPTIONIST, GIFT_CARD, CONVERSATION_GUARD];
const folderIds = (groups: ReturnType<typeof toPromptGroups>) =>
  groups.map((group) => group.folder.id);
const promptIds = (groups: ReturnType<typeof toPromptGroups>) =>
  groups.map((group) => group.prompts.map((prompt) => prompt.id));

describe('toPromptGroups', () => {
  it('keeps every folder and prompt when the query is empty', () => {
    const groups = toPromptGroups(folders, prompts, '');

    expect(folderIds(groups)).toEqual([QA_FOLDER.id, GUARDS_FOLDER.id]);
    expect(promptIds(groups)).toEqual([[RECEPTIONIST.id, GIFT_CARD.id], [CONVERSATION_GUARD.id]]);
  });

  it('keeps only matching prompts and drops folders without matches', () => {
    const groups = toPromptGroups(folders, prompts, 'gift');

    expect(folderIds(groups)).toEqual([QA_FOLDER.id]);
    expect(promptIds(groups)).toEqual([[GIFT_CARD.id]]);
  });

  it('ignores case and surrounding spaces in the query', () => {
    const groups = toPromptGroups(folders, prompts, '  GUARD ');

    expect(folderIds(groups)).toEqual([GUARDS_FOLDER.id]);
    expect(promptIds(groups)).toEqual([[CONVERSATION_GUARD.id]]);
  });

  it('returns no folders when nothing matches', () => {
    expect(toPromptGroups(folders, prompts, 'zzz')).toEqual([]);
  });
});
