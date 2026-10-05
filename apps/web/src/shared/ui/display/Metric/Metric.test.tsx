import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Metric } from '@/shared/ui/display/Metric/Metric';

const ITEMS = [
  { label: 'Latency', value: '1.42 s' },
  { label: 'Cost', value: '$0.0041' },
];

describe('Metric', () => {
  it('pairs every label with its value in a description list', () => {
    render(<Metric items={ITEMS} />);

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Latency',
      'Cost',
    ]);
    expect(screen.getAllByRole('definition').map((value) => value.textContent)).toEqual([
      '1.42 s',
      '$0.0041',
    ]);
  });

  it('renders no terms without items', () => {
    render(<Metric items={[]} />);

    expect(screen.queryAllByRole('term')).toHaveLength(0);
  });

  it('passes native attributes through', () => {
    render(<Metric items={ITEMS} data-testid="metrics" />);

    expect(screen.getByTestId('metrics').tagName).toBe('DL');
  });
});
