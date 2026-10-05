import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResultCard } from '@/shared/ui/ResultCard/ResultCard';

describe('ResultCard', () => {
  it('shows the source, the score and the snippet as an article', () => {
    render(<ResultCard source="Services · Notion" score={0.8123} snippet="Haircut takes 45 min" />);

    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByText('Services · Notion')).toBeInTheDocument();
    expect(screen.getByText('0.81')).toBeInTheDocument();
    expect(screen.getByText('Haircut takes 45 min')).toBeInTheDocument();
  });

  it('omits the score badge when the score is null', () => {
    render(<ResultCard source="Notion" score={null} snippet="Text" />);

    expect(screen.queryByText(/^\d/)).not.toBeInTheDocument();
  });

  it('becomes a link when it has an href', () => {
    render(<ResultCard source="Notion" snippet="Text" href="/knowledge/1" />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/knowledge/1');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('marks every case-insensitive match of the highlight', () => {
    render(<ResultCard source="Notion" snippet="Prices: price list and PRICE" highlight="price" />);

    const marks = document.querySelectorAll('mark');
    expect(Array.from(marks, (mark) => mark.textContent)).toEqual(['Price', 'price', 'PRICE']);
  });

  it('renders no marks when there is no highlight', () => {
    render(<ResultCard source="Notion" snippet="Plain text" highlight={null} />);

    expect(document.querySelector('mark')).toBeNull();
  });

  it('keeps the text around a match', () => {
    render(<ResultCard source="Notion" snippet="a cat sat" highlight="cat" />);

    expect(screen.getByRole('article')).toHaveTextContent('a cat sat');
  });
});
