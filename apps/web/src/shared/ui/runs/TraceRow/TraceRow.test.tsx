import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { TraceRow } from '@/shared/ui/runs/TraceRow/TraceRow';
import { TraceStepKind } from '@/shared/ui/runs/TraceRow/TraceRow.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/runs/TraceRow/TraceRow.module.scss';

const noop = () => undefined;

function Tree() {
  const [selected, setSelected] = useState('agent');

  return (
    <div role="tree" aria-label="Run trace">
      {['agent', 'model', 'tool'].map((id) => (
        <TraceRow
          key={id}
          depth={0}
          kind={TraceStepKind.Tool}
          name={id}
          selected={selected === id}
          onSelect={() => setSelected(id)}
        />
      ))}
    </div>
  );
}

describe('TraceRow', () => {
  it('is a tree item whose level follows its depth', () => {
    render(<TraceRow depth={2} kind={TraceStepKind.Tool} name="create_booking" onSelect={noop} />);

    const item = screen.getByRole('treeitem', { name: 'create_booking' });
    expect(item).toHaveAttribute('aria-level', '3');
    expect(item).toHaveAttribute('aria-selected', 'false');
    expect(item).not.toHaveAttribute('aria-expanded');
  });

  it('marks the selected row and bolds its name through the selected class', () => {
    render(<TraceRow depth={0} kind={TraceStepKind.Agent} name="Agent" selected onSelect={noop} />);

    const item = screen.getByRole('treeitem');
    expect(item).toHaveAttribute('aria-selected', 'true');
    expect(item).toHaveClass(cssClass(styles.selected));
  });

  it('selects on click, Enter and Space', async () => {
    const onSelect = vi.fn<() => void>();
    render(<TraceRow depth={0} kind={TraceStepKind.Agent} name="Agent" onSelect={onSelect} />);
    const item = screen.getByRole('treeitem');

    await userEvent.click(item);
    item.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('draws one indent guide per level of a leaf', () => {
    const { container } = render(
      <TraceRow depth={2} kind={TraceStepKind.Tool} name="Leaf" onSelect={noop} />,
    );

    expect(container.querySelectorAll(`.${cssClass(styles.guide)}`)).toHaveLength(2);
    expect(container.querySelector(`.${cssClass(styles.chevron)}`)).toBeNull();
  });

  it('shows chevron-right for a collapsed parent in place of the last guide', () => {
    const { container } = render(
      <TraceRow
        depth={1}
        kind={TraceStepKind.Agent}
        name="Agent"
        expanded={false}
        onSelect={noop}
      />,
    );

    expect(screen.getByRole('treeitem')).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('[data-icon="chevron-right"]')).toBeInTheDocument();
    expect(container.querySelectorAll(`.${cssClass(styles.guide)}`)).toHaveLength(0);
  });

  it('shows chevron-down for an expanded parent', () => {
    const { container } = render(
      <TraceRow depth={0} kind={TraceStepKind.Agent} name="Agent" expanded onSelect={noop} />,
    );

    expect(screen.getByRole('treeitem')).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('[data-icon="chevron-down"]')).toBeInTheDocument();
  });

  it('toggles from the chevron without selecting the row', async () => {
    const onSelect = vi.fn<() => void>();
    const onToggleExpanded = vi.fn<() => void>();
    render(
      <TraceRow
        depth={0}
        kind={TraceStepKind.Agent}
        name="Agent"
        expanded={false}
        onSelect={onSelect}
        onToggleExpanded={onToggleExpanded}
      />,
    );

    await userEvent.click(screen.getByRole('button', { hidden: true }));

    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('expands with ArrowRight and collapses with ArrowLeft', async () => {
    const onToggleExpanded = vi.fn<() => void>();
    const { rerender } = render(
      <TraceRow
        depth={0}
        kind={TraceStepKind.Agent}
        name="Agent"
        expanded={false}
        onSelect={noop}
        onToggleExpanded={onToggleExpanded}
      />,
    );
    screen.getByRole('treeitem').focus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(onToggleExpanded).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowRight}');
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);

    rerender(
      <TraceRow
        depth={0}
        kind={TraceStepKind.Agent}
        name="Agent"
        expanded
        onSelect={noop}
        onToggleExpanded={onToggleExpanded}
      />,
    );
    await userEvent.keyboard('{ArrowRight}');
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{ArrowLeft}');
    expect(onToggleExpanded).toHaveBeenCalledTimes(2);
  });

  it('moves focus between the items of its tree with the arrow keys', async () => {
    render(<Tree />);
    const [first, second, third] = screen.getAllByRole('treeitem');
    first?.focus();

    await userEvent.keyboard('{ArrowDown}');
    expect(second).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(third).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(second).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(first).toHaveFocus();
  });

  it('shows the duration in mono text', () => {
    render(
      <TraceRow
        depth={0}
        kind={TraceStepKind.Tool}
        name="Tool"
        durationLabel="2.1 s"
        onSelect={noop}
      />,
    );

    expect(screen.getByText('2.1 s')).toHaveClass(cssClass(styles.duration));
  });

  it('replaces the duration with the error word', () => {
    render(
      <TraceRow
        depth={0}
        kind={TraceStepKind.Tool}
        name="Tool"
        durationLabel="2.1 s"
        errorLabel="timeout"
        onSelect={noop}
      />,
    );

    expect(screen.getByText('timeout')).toHaveClass(cssClass(styles.error));
    expect(screen.queryByText('2.1 s')).toBeNull();
  });

  it('shows a spinner beside the running label', () => {
    const { container } = render(
      <TraceRow
        depth={0}
        kind={TraceStepKind.Model}
        name="Model"
        durationLabel="running…"
        running
        onSelect={noop}
      />,
    );

    expect(screen.getByText('running…')).toBeInTheDocument();
    expect(container.querySelector('[data-icon="spinner"]')).toBeInTheDocument();
  });

  it('uses the icon given instead of the default of its kind', () => {
    const { container } = render(
      <TraceRow
        depth={0}
        kind={TraceStepKind.Tool}
        name="Tool"
        icon={IconName.Api}
        onSelect={noop}
      />,
    );

    expect(container.querySelector('[data-icon="api"]')).toBeInTheDocument();
  });

  it('is the one tab stop unless told otherwise', () => {
    const { rerender } = render(
      <TraceRow depth={0} kind={TraceStepKind.Tool} name="Tool" onSelect={noop} />,
    );
    expect(screen.getByRole('treeitem')).toHaveAttribute('tabindex', '0');

    rerender(
      <TraceRow depth={0} kind={TraceStepKind.Tool} name="Tool" tabIndex={-1} onSelect={noop} />,
    );
    expect(screen.getByRole('treeitem')).toHaveAttribute('tabindex', '-1');
  });
});
