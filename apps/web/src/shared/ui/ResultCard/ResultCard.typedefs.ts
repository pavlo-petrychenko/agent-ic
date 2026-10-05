export interface ResultCardProps {
  source: string;
  snippet: string;
  score?: number | null;
  href?: string | null;
  highlight?: string | null;
  className?: string;
}

export interface SnippetSegment {
  text: string;
  match: boolean;
}
