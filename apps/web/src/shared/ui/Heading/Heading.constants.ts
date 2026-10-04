export enum HeadingSize {
  Display = 'display',
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
}

export enum HeadingElement {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  Paragraph = 'p',
}

export const HEADING_DEFAULT_ELEMENT: Readonly<Record<HeadingSize, HeadingElement>> = {
  [HeadingSize.Display]: HeadingElement.H1,
  [HeadingSize.H1]: HeadingElement.H1,
  [HeadingSize.H2]: HeadingElement.H2,
  [HeadingSize.H3]: HeadingElement.H3,
};
