import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VariableChip } from '@/shared/ui/VariableChip/VariableChip';

describe('VariableChip', () => {
  it('renders the variable path wrapped in double braces', () => {
    render(<VariableChip path="event.output.booking_id" />);

    expect(screen.getByText('{{event.output.booking_id}}')).toBeInTheDocument();
  });

  it('keeps the literal text selectable inside surrounding copy', () => {
    render(
      <p>
        Hello <VariableChip path="contact.name" />
      </p>,
    );

    expect(screen.getByText('Hello', { exact: false })).toHaveTextContent('Hello {{contact.name}}');
  });

  it('is not an interactive element', () => {
    render(<VariableChip path="contact.name" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a half-typed path as is', () => {
    render(<VariableChip path="contact." />);

    expect(screen.getByText('{{contact.}}')).toBeInTheDocument();
  });
});
