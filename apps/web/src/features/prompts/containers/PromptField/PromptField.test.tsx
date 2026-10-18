import { PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import type { PromptSource } from '@agent-ic/flow';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  GIFT_CARD_PROMPT,
  Q_AND_A_FOLDER,
  buildPromptLibraryMock,
} from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import { PromptField } from '@/features/prompts/containers/PromptField';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const library = buildPromptLibraryMock([Q_AND_A_FOLDER], [GIFT_CARD_PROMPT]);

const renderField = (source: PromptSource | null) => {
  const onChange = vi.fn<(next: PromptSource) => void>();
  renderWithProviders(
    <PromptField
      workspaceId="ws_demo"
      source={source}
      variables={[]}
      label="Prompt"
      menuLabel="Fields"
      placeholder="Write a prompt"
      error={null}
      onChange={onChange}
    />,
    { mocks: [library] },
  );
  return onChange;
};

describe('PromptField', () => {
  it('edits an inline prompt and writes the text', async () => {
    const onChange = renderField({ kind: PromptSourceKind.Inline, text: '' });

    await userEvent.type(screen.getByRole('textbox', { name: 'Prompt' }), 'Greet the customer');

    expect(onChange).toHaveBeenLastCalledWith({
      kind: PromptSourceKind.Inline,
      text: 'Greet the customer',
    });
  });

  it('picks a library prompt and writes the reference', async () => {
    const onChange = renderField({ kind: PromptSourceKind.Inline, text: '' });

    await userEvent.click(screen.getByRole('button', { name: 'Use a library prompt' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Gift card answers' }));

    expect(onChange).toHaveBeenCalledWith({
      kind: PromptSourceKind.Library,
      promptRef: GIFT_CARD_PROMPT.id,
      pin: { kind: PromptVersionKind.Latest },
    });
  });
});
