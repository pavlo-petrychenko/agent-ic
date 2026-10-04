import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DropZone } from '@/shared/ui/DropZone/DropZone';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/DropZone/DropZone.module.scss';

const PDF = new File(['a'], 'guide.pdf', { type: 'application/pdf' });
const TXT = new File(['b'], 'notes.TXT', { type: 'text/plain' });
const PNG = new File(['c'], 'logo.png', { type: 'image/png' });

const renderZone = (props: Partial<Parameters<typeof DropZone>[0]> = {}) => {
  const onFiles = vi.fn<(files: File[]) => void>();
  const view = render(
    <DropZone
      title="Drop files here or"
      dragTitle={(count) => `Drop to upload ${count} files`}
      browseLabel="browse"
      hint="PDF and text"
      accept={['.pdf', 'text/plain']}
      onFiles={onFiles}
      {...props}
    />,
  );
  return { onFiles, ...view };
};

const getInput = () => {
  const input = document.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not rendered');
  }
  return input;
};

describe('DropZone', () => {
  it('shows the title, the browse affordance and the hint', () => {
    renderZone();

    expect(screen.getByRole('button', { name: 'Drop files here or browse' })).toBeInTheDocument();
    expect(screen.getByText('PDF and text')).toBeInTheDocument();
  });

  it('describes the button with the accepted formats hint', () => {
    renderZone();

    expect(screen.getByRole('button')).toHaveAccessibleDescription('PDF and text');
  });

  it('opens the file picker from the button', async () => {
    renderZone();
    const click = vi.spyOn(getInput(), 'click');

    await userEvent.click(screen.getByRole('button'));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('reports files chosen in the picker and resets it for the next choice', async () => {
    const { onFiles } = renderZone();

    await userEvent.upload(getInput(), [PDF]);

    expect(onFiles).toHaveBeenCalledWith([PDF]);
    expect(getInput().value).toBe('');
  });

  it('restricts the picker to the accepted formats and multiplicity', () => {
    renderZone({ multiple: false });

    expect(getInput()).toHaveAttribute('accept', '.pdf,text/plain');
    expect(getInput()).not.toHaveAttribute('multiple');
  });

  it('reports only accepted files dropped on the zone', () => {
    const { onFiles } = renderZone();

    fireEvent.drop(screen.getByRole('button').parentElement as HTMLElement, {
      dataTransfer: { files: [PDF, PNG, TXT] },
    });

    expect(onFiles).toHaveBeenCalledWith([PDF, TXT]);
  });

  it('keeps only the first accepted file in single mode', () => {
    const { onFiles } = renderZone({ multiple: false });

    fireEvent.drop(screen.getByRole('button').parentElement as HTMLElement, {
      dataTransfer: { files: [PNG, PDF, TXT] },
    });

    expect(onFiles).toHaveBeenCalledWith([PDF]);
  });

  it('ignores a drop without an accepted file', () => {
    const { onFiles } = renderZone();

    fireEvent.drop(screen.getByRole('button').parentElement as HTMLElement, {
      dataTransfer: { files: [PNG] },
    });

    expect(onFiles).not.toHaveBeenCalled();
  });

  it('highlights while a drag is over the zone and clears when it leaves', () => {
    renderZone();
    const zone = screen.getByRole('button').parentElement as HTMLElement;

    fireEvent.dragOver(zone, { dataTransfer: { items: [PDF] } });
    expect(zone).toHaveClass(cssClass(styles.dragging));

    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveClass(cssClass(styles.dragging));
  });

  it('swaps the title for the drag title and hides the browse label while dragging', () => {
    renderZone();
    const zone = screen.getByRole('button').parentElement as HTMLElement;

    fireEvent.dragOver(zone, { dataTransfer: { items: [PDF, TXT, PNG] } });

    expect(screen.getByRole('button', { name: 'Drop to upload 3 files' })).toBeInTheDocument();
    expect(screen.queryByText('browse')).not.toBeInTheDocument();

    fireEvent.dragLeave(zone);

    expect(screen.getByRole('button', { name: 'Drop files here or browse' })).toBeInTheDocument();
  });

  it('counts one file when the browser hides the dragged items', () => {
    renderZone();

    fireEvent.dragOver(screen.getByRole('button').parentElement as HTMLElement, {
      dataTransfer: { items: [] },
    });

    expect(screen.getByRole('button', { name: 'Drop to upload 1 files' })).toBeInTheDocument();
  });

  it('shows the error instead of the hint and keeps the title and browse label', () => {
    renderZone({ error: 'Price list.xlsx is not supported' });

    expect(screen.queryByText('PDF and text')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Drop files here or browse' }),
    ).toHaveAccessibleDescription('Price list.xlsx is not supported');
    expect(screen.getByText('Price list.xlsx is not supported')).toHaveClass(
      cssClass(styles.errorText),
    );
    expect(screen.getByRole('button').parentElement).toHaveClass(cssClass(styles.error));
  });

  it('shows the hint when there is no error', () => {
    renderZone({ error: null });

    expect(screen.getByText('PDF and text')).not.toHaveClass(cssClass(styles.errorText));
  });

  it('announces the drop result in a live region', () => {
    renderZone({ formatResult: (count) => `${count} files added` });

    fireEvent.drop(screen.getByRole('button').parentElement as HTMLElement, {
      dataTransfer: { files: [PDF, TXT] },
    });

    expect(screen.getByRole('status')).toHaveTextContent('2 files added');
  });

  it('does nothing when disabled', async () => {
    const { onFiles } = renderZone({ disabled: true });

    expect(screen.getByRole('button')).toBeDisabled();
    fireEvent.drop(screen.getByRole('button').parentElement as HTMLElement, {
      dataTransfer: { files: [PDF] },
    });

    expect(onFiles).not.toHaveBeenCalled();
  });
});

describe('DropZone accepted formats', () => {
  const dropOn = (files: File[]) =>
    fireEvent.drop(screen.getByRole('button').parentElement as HTMLElement, {
      dataTransfer: { files },
    });

  it('accepts every file when no formats are listed', () => {
    const { onFiles } = renderZone({ accept: [] });

    dropOn([PNG, PDF]);

    expect(onFiles).toHaveBeenCalledWith([PNG, PDF]);
  });

  it('matches extensions case-insensitively', () => {
    const { onFiles } = renderZone({ accept: ['.txt'] });

    dropOn([TXT, PDF]);

    expect(onFiles).toHaveBeenCalledWith([TXT]);
  });

  it('matches exact types', () => {
    const { onFiles } = renderZone({ accept: ['application/pdf'] });

    dropOn([TXT, PDF]);

    expect(onFiles).toHaveBeenCalledWith([PDF]);
  });

  it('matches type wildcards', () => {
    const { onFiles } = renderZone({ accept: ['image/*'] });

    dropOn([PNG, PDF]);

    expect(onFiles).toHaveBeenCalledWith([PNG]);
  });

  it('reports nothing for an empty drop', () => {
    const { onFiles } = renderZone({ accept: [] });

    dropOn([]);

    expect(onFiles).not.toHaveBeenCalled();
  });
});
