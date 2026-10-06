import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Heading } from '@/shared/ui/typography/Heading/Heading';
import { HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading/Heading.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/typography/Heading/Heading.module.scss';

describe('Heading', () => {
  it.each([
    [HeadingSize.Display, 1],
    [HeadingSize.H1, 1],
    [HeadingSize.H2, 2],
    [HeadingSize.H3, 3],
  ])('renders size %s as a level %i heading by default', (size, level) => {
    render(<Heading size={size}>Title</Heading>);

    expect(screen.getByRole('heading', { level, name: 'Title' })).toHaveClass(
      cssClass(styles[size]),
    );
  });

  it('keeps the semantic level independent of the size', () => {
    render(
      <Heading size={HeadingSize.H2} as={HeadingElement.H1}>
        Log in
      </Heading>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Log in' })).toHaveClass(
      cssClass(styles.h2),
    );
  });

  it('can render a paragraph with heading looks', () => {
    render(<Heading as={HeadingElement.Paragraph}>Looks only</Heading>);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Looks only').tagName).toBe('P');
  });

  it('prevents wrapping on request', () => {
    render(<Heading nowrap>Long title</Heading>);

    expect(screen.getByRole('heading')).toHaveClass(cssClass(styles.nowrap));
  });

  it('passes native attributes through', () => {
    render(<Heading id="section-title">Title</Heading>);

    expect(screen.getByRole('heading')).toHaveAttribute('id', 'section-title');
  });
});
