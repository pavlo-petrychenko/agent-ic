import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PromptEditor } from '@/shared/ui/PromptEditor/PromptEditor';
import type { VariableOption } from '@/shared/ui/PromptEditor/PromptEditor.typedefs';

const VARIABLES: readonly VariableOption[] = [
  { id: 'contact.name', label: 'contact.name', group: 'Contact' },
  { id: 'contact.phone', label: 'contact.phone', group: 'Contact' },
  { id: 'channel', label: 'channel', group: 'Conversation' },
];

interface HarnessProps {
  initial?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  readOnlyReason?: string | null;
  error?: string | null;
}

function Harness({
  initial = '',
  onChange,
  readOnly = false,
  readOnlyReason = null,
  error = null,
}: HarnessProps) {
  const [value, setValue] = useState(initial);
  return (
    <PromptEditor
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      variables={VARIABLES}
      label="System prompt"
      menuLabel="Variables"
      readOnly={readOnly}
      readOnlyReason={readOnlyReason}
      error={error}
    />
  );
}

const TYPED_OPEN = '{{{{';

describe('PromptEditor', () => {
  it('is a named multiline textbox showing its value', () => {
    render(<Harness initial={'Hello there\nSecond line'} />);

    const editor = screen.getByRole('textbox', { name: 'System prompt' });

    expect(editor).toHaveAttribute('aria-multiline', 'true');
    expect(editor).toHaveTextContent('Hello there');
    expect(editor).toHaveTextContent('Second line');
  });

  it('shows known variables as chips and unknown ones as plain text', async () => {
    render(<Harness initial="Hi {{contact.name}}, see {{contact.nmae}}" />);

    expect(await screen.findByText('{{contact.name}}')).toBeInTheDocument();
    expect(await screen.findByText('{{contact.nmae}}')).toBeInTheDocument();
  });

  it('reports edits as a string', async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<Harness onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'System prompt' }), 'Hello');

    expect(onChange).toHaveBeenLastCalledWith('Hello');
  });

  it('opens the variable menu after typing two braces and filters it', async () => {
    render(<Harness />);

    await userEvent.type(
      screen.getByRole('textbox', { name: 'System prompt' }),
      `Call ${TYPED_OPEN}con`,
    );

    const listbox = await screen.findByRole('listbox', { name: 'Variables' });

    expect(listbox).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'contact.nameContact',
      'contact.phoneContact',
    ]);
  });

  it('inserts the active option on Enter and closes the menu', async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<Harness onChange={onChange} />);

    await userEvent.type(
      screen.getByRole('textbox', { name: 'System prompt' }),
      `Call ${TYPED_OPEN}con`,
    );
    await screen.findByRole('listbox');
    await userEvent.keyboard('{ArrowDown}{Enter}');

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('Call {{contact.phone}}'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('{{contact.phone}}')).toBeInTheDocument();
  });

  it('inserts an option when it is clicked', async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<Harness onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'System prompt' }), TYPED_OPEN);
    await userEvent.click(await screen.findByRole('option', { name: /channel/ }));

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('{{channel}}'));
  });

  it('points the textbox at the active option', async () => {
    render(<Harness />);
    const editor = screen.getByRole('textbox', { name: 'System prompt' });

    await userEvent.type(editor, TYPED_OPEN);
    const options = await screen.findAllByRole('option');

    expect(editor).toHaveAttribute('aria-activedescendant', options[0]?.id);

    await userEvent.keyboard('{ArrowDown}');

    await waitFor(() => expect(editor).toHaveAttribute('aria-activedescendant', options[1]?.id));
  });

  it('closes the menu on Escape without inserting', async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<Harness onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'System prompt' }), TYPED_OPEN);
    await screen.findByRole('listbox');
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(onChange).toHaveBeenLastCalledWith('{{');
  });

  it('shows no menu when nothing matches', async () => {
    render(<Harness />);

    await userEvent.type(
      screen.getByRole('textbox', { name: 'System prompt' }),
      `${TYPED_OPEN}zzz`,
    );

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('follows a new value from outside', () => {
    const { rerender } = render(
      <PromptEditor
        value="first"
        onChange={vi.fn<(value: string) => void>()}
        variables={VARIABLES}
        label="System prompt"
        menuLabel="Variables"
      />,
    );

    rerender(
      <PromptEditor
        value="second"
        onChange={vi.fn<(value: string) => void>()}
        variables={VARIABLES}
        label="System prompt"
        menuLabel="Variables"
      />,
    );

    expect(screen.getByRole('textbox', { name: 'System prompt' })).toHaveTextContent('second');
  });

  it('shows the error and links it to the textbox', () => {
    render(<Harness error="Unknown variable user.nmae" />);

    expect(screen.getByRole('textbox', { name: 'System prompt' })).toHaveAccessibleDescription(
      'Unknown variable user.nmae',
    );
    expect(screen.getByRole('textbox', { name: 'System prompt' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('is not editable when read-only and explains why', async () => {
    render(
      <Harness
        initial="Locked"
        readOnly
        readOnlyReason="v4 is published — create a draft to edit"
      />,
    );
    const editor = screen.getByRole('textbox', { name: 'System prompt' });

    await userEvent.type(editor, 'more');

    expect(editor).toHaveAttribute('contenteditable', 'false');
    expect(editor).toHaveTextContent('Locked');
    expect(editor).not.toHaveTextContent('more');
    expect(editor).toHaveAccessibleDescription('v4 is published — create a draft to edit');
  });
});
