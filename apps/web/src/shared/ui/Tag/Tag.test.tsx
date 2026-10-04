import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tag } from '@/shared/ui/Tag/Tag';
import { TagKind } from '@/shared/ui/Tag/Tag.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/Tag/Tag.module.scss';

describe('Tag', () => {
  it('renders its label as plain non-interactive text', () => {
    render(<Tag kind={TagKind.Kb}>Catalogue</Tag>);

    const node = screen.getByText('Catalogue');
    expect(node.tagName).toBe('SPAN');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies the kind', () => {
    render(<Tag kind={TagKind.Api}>Shipping</Tag>);

    expect(screen.getByText('Shipping')).toHaveClass(cssClass(styles.api));
  });

  it.each([TagKind.Tool, TagKind.Var])('is monospace by default for %s', (kind) => {
    render(<Tag kind={kind}>label</Tag>);

    expect(screen.getByText('label')).toHaveClass(cssClass(styles.mono));
  });

  it.each([TagKind.Kb, TagKind.Api, TagKind.Neutral])(
    'is proportional by default for %s',
    (kind) => {
      render(<Tag kind={kind}>label</Tag>);

      expect(screen.getByText('label')).not.toHaveClass(cssClass(styles.mono));
    },
  );

  it('lets mono override the kind default in both directions', () => {
    render(
      <>
        <Tag kind={TagKind.Kb} mono>
          forced
        </Tag>
        <Tag kind={TagKind.Tool} mono={false}>
          plain
        </Tag>
      </>,
    );

    expect(screen.getByText('forced')).toHaveClass(cssClass(styles.mono));
    expect(screen.getByText('plain')).not.toHaveClass(cssClass(styles.mono));
  });
});
