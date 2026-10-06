import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EdgeLabel } from '@/shared/ui/flow/EdgeLabel/EdgeLabel';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/flow/EdgeLabel/EdgeLabel.module.scss';

describe('EdgeLabel', () => {
  it('is plain text when it cannot be edited', () => {
    render(<EdgeLabel text="else" />);

    expect(screen.getByText('else')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is a button that reports a click when editable', async () => {
    const onClick = vi.fn<() => void>();
    render(<EdgeLabel text="needs_human" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'needs_human' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('can be edited from the keyboard', async () => {
    const onClick = vi.fn<() => void>();
    render(<EdgeLabel text="needs_human" onClick={onClick} />);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('draws the active style', () => {
    render(<EdgeLabel text="else" active />);

    expect(screen.getByText('else')).toHaveClass(cssClass(styles.active));
  });
});
