import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stepper } from '@/shared/ui/navigation/Stepper/Stepper';

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'review', label: 'Review' },
];

function renderStepper(current: number) {
  return render(
    <Stepper
      steps={STEPS}
      current={current}
      ariaLabel="Setup progress"
      completedLabel="completed"
    />,
  );
}

describe('Stepper', () => {
  it('is a named ordered list with one item per step', () => {
    renderStepper(1);

    const list = screen.getByRole('list', { name: 'Setup progress' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(STEPS.length);
  });

  it('marks only the current step with aria-current', () => {
    renderStepper(1);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).not.toHaveAttribute('aria-current');
  });

  it('announces completed steps with hidden text', () => {
    renderStepper(2);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('completed');
    expect(items[1]).toHaveTextContent('completed');
    expect(items[2]).not.toHaveTextContent('completed');
  });

  it('shows a number for the current and upcoming steps and a check for done ones', () => {
    const { container } = renderStepper(1);

    const items = screen.getAllByRole('listitem');
    expect(items[0]?.querySelector('[data-icon="check"]')).toBeInTheDocument();
    expect(items[1]).toHaveTextContent('2');
    expect(items[2]).toHaveTextContent('3');
    expect(container.querySelectorAll('[data-icon="check"]')).toHaveLength(1);
  });

  it('has no current step once every step is done', () => {
    renderStepper(STEPS.length);

    for (const item of screen.getAllByRole('listitem')) {
      expect(item).not.toHaveAttribute('aria-current');
    }
  });
});
