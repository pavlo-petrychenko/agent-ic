import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DiffLine } from '@/shared/ui/DiffLine/DiffLine';
import { DIFF_SIGN_GLYPH, DiffSign } from '@/shared/ui/DiffLine/DiffLine.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/DiffLine/DiffLine.module.scss';

describe('DiffLine', () => {
  it('is a list item whose text includes the spoken sign label', () => {
    render(
      <ul>
        <DiffLine sign={DiffSign.Added} signLabel="Added">
          Node Greeting
        </DiffLine>
      </ul>,
    );

    expect(screen.getByRole('listitem')).toHaveTextContent('Added');
    expect(screen.getByRole('listitem')).toHaveTextContent('Node Greeting');
  });

  it('hides the glyph from assistive technology', () => {
    render(
      <ul>
        <DiffLine sign={DiffSign.Removed} signLabel="Removed">
          Old tool
        </DiffLine>
      </ul>,
    );

    const glyph = within(screen.getByRole('listitem')).getByText(DIFF_SIGN_GLYPH[DiffSign.Removed]);
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(Object.values(DiffSign))('shows the glyph and colour class for %s', (sign) => {
    render(
      <ul>
        <DiffLine sign={sign} signLabel={sign}>
          Item
        </DiffLine>
      </ul>,
    );

    expect(screen.getByText(DIFF_SIGN_GLYPH[sign])).toHaveClass(cssClass(styles[sign]));
  });

  it('uses the true minus sign for removals', () => {
    expect(DIFF_SIGN_GLYPH[DiffSign.Removed]).toBe('−');
  });
});
