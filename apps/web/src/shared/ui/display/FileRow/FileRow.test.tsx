import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileRow } from '@/shared/ui/display/FileRow/FileRow';
import { FileRowList } from '@/shared/ui/display/FileRow/FileRowList';

describe('FileRow', () => {
  it('shows the file name, subtitle and status as a list item', () => {
    render(
      <FileRowList aria-label="Added files">
        <FileRow
          icon={<span>pdf</span>}
          name="price-list.pdf"
          subtitle="2.4 MB · 12 pages"
          status={<span>Ready</span>}
          removeLabel="Remove"
          onRemove={vi.fn<() => void>()}
        />
      </FileRowList>,
    );

    const item = within(screen.getByRole('list', { name: 'Added files' })).getByRole('listitem');
    expect(item).toHaveTextContent('price-list.pdf');
    expect(item).toHaveTextContent('2.4 MB · 12 pages');
    expect(item).toHaveTextContent('Ready');
  });

  it('removes the file through a button named after it', async () => {
    const onRemove = vi.fn<() => void>();
    render(
      <ul>
        <FileRow
          icon={null}
          name="price-list.pdf"
          subtitle="2.4 MB"
          removeLabel="Remove"
          onRemove={onRemove}
        />
      </ul>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove price-list.pdf' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('cannot be removed while disabled', async () => {
    const onRemove = vi.fn<() => void>();
    render(
      <ul>
        <FileRow
          icon={null}
          name="price-list.pdf"
          subtitle="2.4 MB"
          removeLabel="Remove"
          onRemove={onRemove}
          disabled
        />
      </ul>,
    );

    const button = screen.getByRole('button', { name: 'Remove price-list.pdf' });
    await userEvent.click(button, { pointerEventsCheck: 0 });

    expect(button).toBeDisabled();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
