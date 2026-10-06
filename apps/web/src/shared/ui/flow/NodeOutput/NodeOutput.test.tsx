import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NodeOutput } from '@/shared/ui/flow/NodeOutput/NodeOutput';
import { NODE_OUTPUT_ARROW } from '@/shared/ui/flow/NodeOutput/NodeOutput.constants';

describe('NodeOutput', () => {
  it('shows what the node outputs', () => {
    render(<NodeOutput text="reply" />);

    expect(screen.getByText('reply')).toBeInTheDocument();
  });

  it('hides the arrow prefix from assistive technology', () => {
    render(<NodeOutput text="reply" />);

    expect(screen.getByText(NODE_OUTPUT_ARROW)).toHaveAttribute('aria-hidden', 'true');
  });
});
