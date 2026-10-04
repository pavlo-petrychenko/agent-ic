import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CodeBlock } from '@/shared/ui/CodeBlock/CodeBlock';
import { CodeTone } from '@/shared/ui/CodeBlock/CodeBlock.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/CodeBlock/CodeBlock.module.scss';

const CODE = '{\n  "ok": true\n}';

const getPre = () => {
  const pre = document.querySelector('pre');
  if (pre === null) {
    throw new Error('pre not rendered');
  }
  return pre;
};

describe('CodeBlock', () => {
  it('renders the code verbatim inside pre and code', () => {
    render(<CodeBlock code={CODE} />);

    const pre = getPre();
    expect(pre.querySelector('code')?.textContent).toBe(CODE);
  });

  it('lets the wrap prop override the tone default', () => {
    const { rerender } = render(<CodeBlock code={CODE} tone={CodeTone.Light} wrap={false} />);
    expect(getPre()).toHaveClass(cssClass(styles.scrolling));

    rerender(<CodeBlock code={CODE} tone={CodeTone.Dark} wrap />);
    expect(getPre()).toHaveClass(cssClass(styles.wrapped));
  });

  it('makes a scrolling block keyboard focusable and a wrapping block not', () => {
    const { rerender } = render(<CodeBlock code={CODE} tone={CodeTone.Dark} />);
    expect(getPre()).toHaveAttribute('tabindex', '0');
    expect(getPre()).toHaveClass(cssClass(styles.scrolling));

    rerender(<CodeBlock code={CODE} tone={CodeTone.Light} />);
    expect(getPre()).not.toHaveAttribute('tabindex');
    expect(getPre()).toHaveClass(cssClass(styles.wrapped));
  });

  it('exposes the language as a data attribute', () => {
    render(<CodeBlock code={CODE} language="json" />);

    expect(getPre().querySelector('code')).toHaveAttribute('data-language', 'json');
  });

  it('has no copy button unless a label is given', () => {
    render(<CodeBlock code={CODE} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('copies the code to the clipboard', async () => {
    const user = userEvent.setup();
    render(<CodeBlock code={CODE} copyLabel="Copy code" />);

    await user.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(await navigator.clipboard.readText()).toBe(CODE);
  });
});
