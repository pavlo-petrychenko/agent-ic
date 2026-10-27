import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ComboboxGroup, ComboboxOption } from '@/shared/ui/inputs/Combobox';
import { Combobox } from '@/shared/ui/inputs/Combobox/Combobox';

const FOLDERS: readonly ComboboxOption[] = [
  { value: 'Q&A', label: 'Q&A' },
  { value: 'Guards & tags', label: 'Guards & tags' },
];

const createLabel = (query: string): string => `Create “${query}”`;

const MODELS: readonly ComboboxOption[] = [
  {
    value: 'platform:luna',
    label: 'Luna',
    description: 'OpenAI · $0.10 / $0.50 per 1M tokens',
    group: 'platform',
  },
  { value: 'key-a:gpt-4o', label: 'gpt-4o', group: 'key-a' },
  { value: 'key-b:mistral-large', label: 'mistral-large', group: 'key-b' },
];

const groupsWith = (retry: () => void): readonly ComboboxGroup[] => [
  { id: 'platform', label: 'Platform models' },
  { id: 'key-a', label: 'OpenAI · your key', creatable: true },
  { id: 'key-b', label: 'Mistral · your key', creatable: true },
  {
    id: 'key-c',
    label: 'Proxy · your key',
    hint: 'Couldn’t load the models',
    action: { label: 'Retry', onSelect: retry },
    creatable: true,
  },
];

type CreateHandler = (query: string, group: string | null) => void;
type RetryHandler = () => void;

function Grouped({ onCreate, retry }: { onCreate: CreateHandler; retry: RetryHandler }) {
  const [value, setValue] = useState('');

  return (
    <Combobox
      aria-label="Model"
      value={value}
      options={MODELS}
      groups={groupsWith(retry)}
      onChange={setValue}
      onCreate={onCreate}
      searchLabel="Search models"
      searchClearLabel="Clear model search"
      emptyLabel="No models found"
      createLabel={(query) => `Use “${query}”`}
    />
  );
}

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

  it('lists options under the heading of their group with its hint and action', async () => {
    const retry = vi.fn<RetryHandler>();
    render(<Grouped onCreate={vi.fn<CreateHandler>()} retry={retry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Model' }));

    expect(
      within(screen.getByRole('group', { name: 'Platform models' })).getByRole('button', {
        name: 'Luna',
        description: 'OpenAI · $0.10 / $0.50 per 1M tokens',
      }),
    ).toBeVisible();
    expect(
      within(screen.getByRole('group', { name: 'OpenAI · your key' })).getByRole('button', {
        name: 'gpt-4o',
      }),
    ).toBeVisible();
    const failed = screen.getByRole('group', { name: 'Proxy · your key' });
    expect(within(failed).getByText('Couldn’t load the models')).toBeVisible();
    await userEvent.click(within(failed).getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('shows the label of the chosen option on the trigger', async () => {
    render(<Grouped onCreate={vi.fn<CreateHandler>()} retry={vi.fn<RetryHandler>()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Model' }));
    await userEvent.click(screen.getByRole('button', { name: 'Luna' }));

    const trigger = screen.getByRole('button', { name: 'Model' });
    expect(trigger).toHaveTextContent('Luna');
    expect(trigger).not.toHaveTextContent('OpenAI');
  });

  it('finds an option by its description', async () => {
    render(<Grouped onCreate={vi.fn<CreateHandler>()} retry={vi.fn<RetryHandler>()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Model' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search models' }), 'openai');

    expect(
      within(screen.getByRole('group', { name: 'Platform models' })).getByRole('button', {
        name: 'Luna',
      }),
    ).toBeVisible();
  });

  it('creates a typed value in the creatable group the search matches', async () => {
    const onCreate = vi.fn<CreateHandler>();
    render(<Grouped onCreate={onCreate} retry={vi.fn<RetryHandler>()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Model' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search models' }), 'mistral');
    const group = screen.getByRole('group', { name: 'Mistral · your key' });
    await userEvent.click(within(group).getByRole('button', { name: 'Use “mistral”' }));

    expect(onCreate).toHaveBeenCalledWith('mistral', 'key-b');
  });

  it('creates a typed value in the first creatable group when no group matches', async () => {
    const onCreate = vi.fn<CreateHandler>();
    render(<Grouped onCreate={onCreate} retry={vi.fn<RetryHandler>()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Model' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search models' }), 'o3-pro');
    const group = screen.getByRole('group', { name: 'OpenAI · your key' });
    await userEvent.click(within(group).getByRole('button', { name: 'Use “o3-pro”' }));

    expect(onCreate).toHaveBeenCalledWith('o3-pro', 'key-a');
  });
});
