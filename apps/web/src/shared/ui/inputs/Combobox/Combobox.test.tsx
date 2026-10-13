import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { ComboboxOption } from '@/shared/ui/inputs/Combobox';
import { Combobox } from '@/shared/ui/inputs/Combobox/Combobox';

const FOLDERS: readonly ComboboxOption[] = [
  { value: 'Q&A', label: 'Q&A' },
  { value: 'Guards & tags', label: 'Guards & tags' },
];

const createLabel = (query: string): string => `Create “${query}”`;

function Controlled({ creatable }: { creatable: boolean }) {
  const [value, setValue] = useState('');

  return (
    <Combobox
      aria-label="Folder"
      value={value}
      options={FOLDERS}
      onChange={setValue}
      searchLabel="Search folders"
      searchClearLabel="Clear folder search"
      emptyLabel="No folders found"
      createLabel={creatable ? createLabel : null}
    />
  );
}

describe('Combobox', () => {
  it('selects an existing option', async () => {
    render(<Controlled creatable={false} />);

    await userEvent.click(screen.getByRole('button', { name: 'Folder' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guards & tags' }));

    expect(screen.getByRole('button', { name: 'Folder' })).toHaveTextContent('Guards & tags');
  });

  it('offers to create a value that is not an option', async () => {
    render(<Controlled creatable />);

    await userEvent.click(screen.getByRole('button', { name: 'Folder' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search folders' }), 'Messages');
    await userEvent.click(screen.getByRole('button', { name: 'Create “Messages”' }));

    expect(screen.getByRole('button', { name: 'Folder' })).toHaveTextContent('Messages');
  });

  it('does not offer to create an existing option', async () => {
    render(<Controlled creatable />);

    await userEvent.click(screen.getByRole('button', { name: 'Folder' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search folders' }), 'Q&A');

    expect(screen.queryByRole('button', { name: 'Create “Q&A”' })).not.toBeInTheDocument();
  });

  it('does not offer to create without a create label', async () => {
    render(<Controlled creatable={false} />);

    await userEvent.click(screen.getByRole('button', { name: 'Folder' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search folders' }), 'Messages');

    expect(screen.queryByRole('button', { name: 'Create “Messages”' })).not.toBeInTheDocument();
    expect(screen.getByText('No folders found')).toBeInTheDocument();
  });
});
