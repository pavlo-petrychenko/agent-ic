import { EditorView } from '@codemirror/view';
import { act, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { CodeEditor } from '@/shared/ui/CodeEditor/CodeEditor';

const CODE = '{\n  "ok": true\n}';

const getView = (container: HTMLElement): EditorView => {
  const dom = container.querySelector('.cm-editor');
  const view = dom === null ? null : EditorView.findFromDOM(dom as HTMLElement);
  if (view === null) {
    throw new Error('editor not rendered');
  }
  return view;
};

describe('CodeEditor', () => {
  beforeAll(() => {
    const emptyRects = () => {
      const list: DOMRect[] = [];
      return Object.assign(list, { item: () => null }) as unknown as DOMRectList;
    };
    Range.prototype.getClientRects = emptyRects;
    Range.prototype.getBoundingClientRect = () => new DOMRect();
  });

  it('names the region after the file and shows the language', () => {
    render(<CodeEditor file="check_order.json" language="json" code={CODE} />);

    expect(screen.getByRole('region', { name: 'check_order.json' })).toBeInTheDocument();
    expect(screen.getByText('json')).toBeInTheDocument();
  });

  it('renders the code read-only by default, without an editor', () => {
    const { container } = render(
      <CodeEditor file="a.json" language="json" code={CODE} readOnly onChange={null} />,
    );

    expect(container.querySelector('code')?.textContent).toBe(CODE);
    expect(container.querySelector('.cm-editor')).toBeNull();
  });

  it('stays read-only when editable is requested without a change handler', () => {
    const { container } = render(
      <CodeEditor file="a.json" language="json" code={CODE} readOnly={false} onChange={null} />,
    );

    expect(container.querySelector('.cm-editor')).toBeNull();
  });

  it('mounts a labelled editor with the code when editable', () => {
    const { container } = render(
      <CodeEditor
        file="a.json"
        language="json"
        code={CODE}
        readOnly={false}
        onChange={vi.fn<(code: string) => void>()}
        label="Tool definition"
      />,
    );

    expect(getView(container).state.doc.toString()).toBe(CODE);
    expect(screen.getByRole('textbox', { name: 'Tool definition' })).toBeInTheDocument();
  });

  it('falls back to the file name as the editor label', () => {
    render(
      <CodeEditor
        file="a.json"
        language="json"
        code={CODE}
        readOnly={false}
        onChange={vi.fn<(code: string) => void>()}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'a.json' })).toBeInTheDocument();
  });

  it('describes the editor by the hint', () => {
    render(
      <CodeEditor
        file="a.json"
        language="json"
        code={CODE}
        readOnly={false}
        onChange={vi.fn<(code: string) => void>()}
        hint="Press Escape then Tab to leave"
      />,
    );

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'Press Escape then Tab to leave',
    );
  });

  it('reports edits through onChange', () => {
    const onChange = vi.fn<(code: string) => void>();
    const { container } = render(
      <CodeEditor file="a.json" language="json" code={CODE} readOnly={false} onChange={onChange} />,
    );

    act(() => {
      getView(container).dispatch({ changes: { from: 0, insert: '[]' } });
    });

    expect(onChange).toHaveBeenCalledWith(`[]${CODE}`);
  });

  it('applies a new code prop without reporting it as an edit', () => {
    const onChange = vi.fn<(code: string) => void>();
    const { container, rerender } = render(
      <CodeEditor file="a.json" language="json" code={CODE} readOnly={false} onChange={onChange} />,
    );

    rerender(
      <CodeEditor file="a.json" language="json" code="{}" readOnly={false} onChange={onChange} />,
    );

    expect(getView(container).state.doc.toString()).toBe('{}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the unsaved marker with its label only when unsaved', () => {
    const { rerender } = render(
      <CodeEditor file="a.json" language="json" code={CODE} unsavedLabel="Unsaved changes" />,
    );
    expect(screen.queryByRole('img', { name: 'Unsaved changes' })).not.toBeInTheDocument();

    rerender(
      <CodeEditor
        file="a.json"
        language="json"
        code={CODE}
        unsaved
        unsavedLabel="Unsaved changes"
      />,
    );
    expect(screen.getByRole('img', { name: 'Unsaved changes' })).toBeInTheDocument();
  });
});
