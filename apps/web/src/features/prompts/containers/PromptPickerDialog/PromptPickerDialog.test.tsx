import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  GIFT_CARD_PROMPT,
  Q_AND_A_FOLDER,
  RECEPTIONIST_PROMPT,
  buildPromptLibraryMock,
} from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import { PromptPickerDialog } from '@/features/prompts/containers/PromptPickerDialog';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const libraryMock = () =>
  buildPromptLibraryMock([Q_AND_A_FOLDER], [RECEPTIONIST_PROMPT, GIFT_CARD_PROMPT]);

describe('PromptPickerDialog', () => {
  it('groups the prompts by folder and picks one', async () => {
    const onPick = vi.fn<(promptId: string) => void>();
    renderWithProviders(<PromptPickerDialog onPick={onPick} onClose={() => undefined} />, {
      mocks: [libraryMock()],
    });

    const dialog = await screen.findByRole('dialog', { name: 'Use a library prompt' });
    expect(await within(dialog).findByText('Q&A')).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Receptionist' })).toBeVisible();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Gift card answers' }));

    expect(onPick).toHaveBeenCalledWith(GIFT_CARD_PROMPT.id);
  });

  it('filters the prompts by the search query', async () => {
    renderWithProviders(<PromptPickerDialog onPick={() => undefined} onClose={() => undefined} />, {
      mocks: [libraryMock()],
    });

    const dialog = await screen.findByRole('dialog', { name: 'Use a library prompt' });
    await within(dialog).findByRole('button', { name: 'Receptionist' });
    await userEvent.type(within(dialog).getByRole('searchbox', { name: 'Search prompts' }), 'gift');

    expect(within(dialog).getByRole('button', { name: 'Gift card answers' })).toBeVisible();
    expect(within(dialog).queryByRole('button', { name: 'Receptionist' })).toBeNull();
  });

  it('says when the library is empty', async () => {
    renderWithProviders(<PromptPickerDialog onPick={() => undefined} onClose={() => undefined} />, {
      mocks: [buildPromptLibraryMock([], [])],
    });

    const dialog = await screen.findByRole('dialog', { name: 'Use a library prompt' });

    expect(await within(dialog).findByText('No prompts yet')).toBeVisible();
  });
});
