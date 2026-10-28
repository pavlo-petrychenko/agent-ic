import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddSourceDialog } from '@/features/knowledge/containers/AddSourceDialog';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const PDF = new File(['a'], 'services.pdf', { type: 'application/pdf' });
const XLSX = new File(['b'], 'prices.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

const renderDialog = () => {
  const onClose = vi.fn<() => void>();
  const onAddFiles = vi.fn<(files: readonly File[]) => void>();
  renderWithProviders(
    <AddSourceDialog
      knowledgeBaseName="Services & prices"
      onClose={onClose}
      onAddFiles={onAddFiles}
    />,
  );
  return { onClose, onAddFiles };
};

const fileInput = (): HTMLInputElement => {
  const input = document.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not rendered');
  }
  return input;
};

describe('AddSourceDialog', () => {
  it('shows the upload source type and adds valid files while skipping unsupported ones', async () => {
    const user = userEvent.setup();
    const { onClose, onAddFiles } = renderDialog();

    expect(
      screen.getByRole('dialog', { name: 'Add source to “Services & prices”' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Upload files')).toBeInTheDocument();
    expect(screen.getByText('Google Docs')).toBeInTheDocument();
    expect(screen.getByText('ClickUp')).toBeInTheDocument();

    await user.upload(fileInput(), [PDF, XLSX]);

    expect(await screen.findByText('services.pdf')).toBeInTheDocument();
    expect(screen.getByText('prices.xlsx')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    expect(screen.getByText('not supported')).toBeInTheDocument();

    const add = screen.getByRole('button', { name: 'Add 1 file' });
    expect(add).toBeEnabled();
    await user.click(add);

    expect(onAddFiles).toHaveBeenCalledWith([PDF]);
    expect(onClose).toHaveBeenCalled();
  });

  it('removes a selected file and disables adding when none are ready', async () => {
    const user = userEvent.setup();
    const { onAddFiles } = renderDialog();

    await user.upload(fileInput(), [PDF]);
    await user.click(screen.getByRole('button', { name: 'Remove services.pdf' }));

    expect(screen.queryByText('services.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('No files selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add files' })).toBeDisabled();
    expect(onAddFiles).not.toHaveBeenCalled();
  });

  it('keeps the footer count in sync with ready and skipped files', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.upload(fileInput(), [PDF, XLSX]);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('1 ready · 1 skipped')).toBeInTheDocument();
  });
});
