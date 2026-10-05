import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KeyValue } from '@/shared/ui/display/KeyValue/KeyValue';
import { KeyValueLayout } from '@/shared/ui/display/KeyValue/KeyValue.constants';

const ITEMS = [
  { label: 'Plan', value: 'Starter' },
  { label: 'Region', value: 'Frankfurt', trailing: <span>EU</span> },
];

describe('KeyValue', () => {
  it('pairs every label with its value in a description list', () => {
    const { container } = render(<KeyValue items={ITEMS} />);

    const terms = container.querySelectorAll('dt');
    const details = container.querySelectorAll('dd');
    expect(terms).toHaveLength(2);
    expect(terms[0]).toHaveTextContent('Plan');
    expect(details[0]).toHaveTextContent('Starter');
    expect(terms[1]).toHaveTextContent('Region');
    expect(details[1]).toHaveTextContent('Frankfurt');
  });

  it('shows the trailing content of a row beside its value', () => {
    render(<KeyValue items={ITEMS} layout={KeyValueLayout.Props} />);

    const region = screen.getByText('Region').closest('div');
    expect(region).not.toBeNull();
    expect(within(region as HTMLElement).getByText('EU')).toBeInTheDocument();
  });

  it('keeps the label column at the default width until a width is given', () => {
    const { container, rerender } = render(
      <KeyValue items={ITEMS} layout={KeyValueLayout.DefList} />,
    );
    expect(container.querySelector('dl > div')).not.toHaveAttribute('style');

    rerender(<KeyValue items={ITEMS} layout={KeyValueLayout.DefList} labelWidth={160} />);
    expect(container.querySelector('dl > div')).toHaveStyle({ gridTemplateColumns: '160px 1fr' });
  });
});
