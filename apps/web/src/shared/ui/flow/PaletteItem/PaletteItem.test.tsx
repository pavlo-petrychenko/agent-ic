import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { PaletteItem } from '@/shared/ui/flow/PaletteItem/PaletteItem';
import { PALETTE_ITEM_DRAG_TYPE } from '@/shared/ui/flow/PaletteItem/PaletteItem.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/flow/PaletteItem/PaletteItem.module.scss';

const LABEL = 'Send message';

const createDataTransfer = () => ({
  setData: vi.fn<() => void>(),
  setDragImage: vi.fn<() => void>(),
  effectAllowed: 'none',
});

describe('PaletteItem', () => {
  it('is a button named after the step', () => {
    render(<PaletteItem label={LABEL} kind={NodeKind.Send} onSelect={vi.fn<() => void>()} />);

    expect(screen.getByRole('button', { name: LABEL })).toBeInTheDocument();
  });

  it.each(['{Enter}', ' '])('inserts the step with %s', async (key) => {
    const onSelect = vi.fn<() => void>();
    render(<PaletteItem label={LABEL} kind={NodeKind.Send} onSelect={onSelect} />);

    await userEvent.tab();
    await userEvent.keyboard(key);

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('does nothing when disabled', async () => {
    const onSelect = vi.fn<() => void>();
    render(<PaletteItem label={LABEL} kind={NodeKind.Send} onSelect={onSelect} disabled />);

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('is a drag source only when it carries drag data', () => {
    const { rerender } = render(
      <PaletteItem label={LABEL} kind={NodeKind.Send} onSelect={vi.fn<() => void>()} />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('draggable', 'false');

    rerender(
      <PaletteItem
        label={LABEL}
        kind={NodeKind.Send}
        onSelect={vi.fn<() => void>()}
        dragData="send"
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('draggable', 'true');
  });

  it('puts its data on the drag and shows the dragging style until the drop', () => {
    render(
      <PaletteItem
        label={LABEL}
        kind={NodeKind.Send}
        onSelect={vi.fn<() => void>()}
        dragData="send"
        ghost={<span>Ghost</span>}
      />,
    );
    const button = screen.getByRole('button');
    const dataTransfer = createDataTransfer();
    const dragStart = createEvent.dragStart(button);
    Object.defineProperty(dragStart, 'dataTransfer', { value: dataTransfer });

    fireEvent(button, dragStart);

    expect(dataTransfer.setData).toHaveBeenCalledWith(PALETTE_ITEM_DRAG_TYPE, 'send');
    expect(dataTransfer.setDragImage).toHaveBeenCalledOnce();
    expect(button).toHaveClass(cssClass(styles.dragging));

    fireEvent.dragEnd(button);

    expect(button).not.toHaveClass(cssClass(styles.dragging));
  });

  it('keeps the drag ghost away from assistive technology', () => {
    render(
      <PaletteItem
        label={LABEL}
        kind={NodeKind.Send}
        onSelect={vi.fn<() => void>()}
        dragData="send"
        ghost={<button type="button">Ghost</button>}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
