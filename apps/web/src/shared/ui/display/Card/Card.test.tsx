import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from '@/shared/ui/display/Card/Card';
import { CardElement, CardGap, CardPad, CardTone } from '@/shared/ui/display/Card/Card.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/display/Card/Card.module.scss';

describe('Card', () => {
  it('names its region after the title', () => {
    render(<Card title="Workspace">Body</Card>);

    expect(screen.getByRole('region', { name: 'Workspace' })).toHaveTextContent('Body');
    expect(screen.getByRole('heading', { level: 2, name: 'Workspace' })).toBeInTheDocument();
  });

  it('renders content without a title', () => {
    render(<Card>Body</Card>);

    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('uses the default tone, padding and gap', () => {
    render(<Card>Body</Card>);

    expect(screen.getByText('Body')).toHaveClass(
      cssClass(styles.default),
      cssClass(styles['pad-md']),
      cssClass(styles['gap-md']),
    );
  });

  it.each(Object.values(CardTone))('applies the %s tone', (tone) => {
    render(<Card tone={tone}>Body</Card>);

    expect(screen.getByText('Body')).toHaveClass(cssClass(styles[tone]));
  });

  it('gives the sunken tone tighter padding and gap by default', () => {
    render(<Card tone={CardTone.Sunken}>Body</Card>);

    expect(screen.getByText('Body')).toHaveClass(
      cssClass(styles['pad-sm']),
      cssClass(styles['gap-xs']),
    );
  });

  it('lets explicit padding and gap win over the tone defaults', () => {
    render(
      <Card tone={CardTone.Sunken} pad={CardPad.Xl} gap={CardGap.Xl}>
        Body
      </Card>,
    );

    expect(screen.getByText('Body')).toHaveClass(
      cssClass(styles['pad-xl']),
      cssClass(styles['gap-xl']),
    );
  });

  it('marks a selected card as current', () => {
    const { rerender } = render(<Card selected>Body</Card>);
    expect(screen.getByText('Body')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Body')).toHaveClass(cssClass(styles.selected));

    rerender(<Card>Body</Card>);
    expect(screen.getByText('Body')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Body')).not.toHaveClass(cssClass(styles.selected));
  });

  it('renders the requested element', () => {
    render(
      <ul>
        <Card as={CardElement.Li}>Row</Card>
      </ul>,
    );

    expect(screen.getByRole('listitem')).toHaveTextContent('Row');
  });

  it('removes padding and gap for content that fills the card', () => {
    render(<Card flush>Table</Card>);

    expect(screen.getByText('Table')).toHaveClass(cssClass(styles.flush));
  });

  it('passes native attributes through', () => {
    render(<Card data-testid="card">Body</Card>);

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});
