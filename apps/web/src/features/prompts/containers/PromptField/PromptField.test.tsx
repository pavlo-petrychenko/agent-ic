import { PromptSourceKind, PromptVersionKind } from '@agent-ic/flow';
import type { PromptSource } from '@agent-ic/flow';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  RECEPTIONIST_VERSIONS,
  buildPromptVersionsMock,
} from '@/features/prompts/communication/fixtures/promptDetail.fixture';
import {
  GIFT_CARD_PROMPT,
  Q_AND_A_FOLDER,
  RECEPTIONIST_PROMPT,
  buildPromptLibraryMock,
} from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import { PromptField } from '@/features/prompts/containers/PromptField';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const library = buildPromptLibraryMock([Q_AND_A_FOLDER], [GIFT_CARD_PROMPT, RECEPTIONIST_PROMPT]);

const renderField = (
  source: PromptSource | null,
  variables: readonly VariableOption[] = [],
  mocks = [library],
) => {
  const onChange = vi.fn<(next: PromptSource) => void>();
  renderWithProviders(
    <PromptField
      workspaceId="ws_demo"
      source={source}
      variables={variables}
      error={null}
      onChange={onChange}
    />,
    { mocks },
  );
  return onChange;
};

const renderControlledField = (variables: readonly VariableOption[], mocks = [library]) => {
  const onChange = vi.fn<(next: PromptSource) => void>();
  function Harness() {
    const [source, setSource] = useState<PromptSource | null>(null);
    return (
      <PromptField
        workspaceId="ws_demo"
        source={source}
        variables={variables}
        error={null}
        onChange={(next) => {
          setSource(next);
          onChange(next);
        }}
      />
    );
  }
  renderWithProviders(<Harness />, { mocks });
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

  it('fills an exact prompt variable after the prompt is picked', async () => {
    const onChange = renderControlledField(
      [{ id: 'contact.name', label: 'contact.name', group: 'User' }],
      [library, buildPromptVersionsMock(RECEPTIONIST_PROMPT, RECEPTIONIST_VERSIONS)],
    );

    await userEvent.click(screen.getByRole('button', { name: 'Use a library prompt' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Receptionist' }));

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        kind: PromptSourceKind.Library,
        promptRef: RECEPTIONIST_PROMPT.id,
        pin: { kind: PromptVersionKind.Latest },
        bindings: { 'contact.name': 'contact.name' },
      }),
    );
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
