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
    <PromptField workspaceId="ws_demo" source={source} error={null} onChange={onChange} />,
    { mocks: [library] },
  );
  return onChange;
};

describe('PromptField', () => {
  it('asks for a prompt when the step has none', () => {
    renderField(null);

    expect(
      screen.getByText('This step has no prompt yet. Pick one from the library.'),
    ).toBeVisible();
  });

  it('picks a library prompt and writes the reference', async () => {
    const onChange = renderField(null);

    await userEvent.click(screen.getByRole('button', { name: 'Use a library prompt' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Gift card answers' }));

    expect(onChange).toHaveBeenCalledWith({
      kind: PromptSourceKind.Library,
      promptRef: GIFT_CARD_PROMPT.id,
      pin: { kind: PromptVersionKind.Latest },
      bindings: {},
    });
  });
});
