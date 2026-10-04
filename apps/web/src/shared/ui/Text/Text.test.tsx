import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text } from '@/shared/ui/Text/Text';
import { TextColor, TextElement, TextKind } from '@/shared/ui/Text/Text.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/Text/Text.module.scss';

describe('Text', () => {
  it('renders a paragraph with the body kind by default', () => {
    render(<Text>Hello</Text>);

    const node = screen.getByText('Hello');
    expect(node.tagName).toBe('P');
    expect(node).toHaveClass(cssClass(styles.body));
  });

  it('renders the requested element', () => {
    render(<Text as={TextElement.Span}>Inline</Text>);

    expect(screen.getByText('Inline').tagName).toBe('SPAN');
  });

  it('applies kind and colour independently', () => {
    render(
      <Text kind={TextKind.Caption} color={TextColor.Err}>
        Failed
      </Text>,
    );

    expect(screen.getByText('Failed')).toHaveClass(cssClass(styles.caption), cssClass(styles.err));
  });

  it('adds no colour class unless a colour is chosen', () => {
    render(<Text kind={TextKind.Title}>Title</Text>);

    const node = screen.getByText('Title');
    Object.values(TextColor).forEach((color) => {
      expect(node).not.toHaveClass(cssClass(styles[color]));
    });
  });

  it('enables tabular numerals on request', () => {
    render(<Text tabularNums>42</Text>);

    expect(screen.getByText('42')).toHaveClass(cssClass(styles.tabular));
  });

  it('passes native attributes through', () => {
    render(<Text id="note">Note</Text>);

    expect(screen.getByText('Note')).toHaveAttribute('id', 'note');
  });
});
