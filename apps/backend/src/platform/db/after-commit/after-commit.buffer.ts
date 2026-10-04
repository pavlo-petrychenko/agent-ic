import type { AfterCommitAction } from '@/platform/db/after-commit/after-commit.typedefs';

export class AfterCommitBuffer {
  private readonly actions: AfterCommitAction[] = [];
  private open = true;

  isOpen(): boolean {
    return this.open;
  }

  add(action: AfterCommitAction): void {
    this.actions.push(action);
  }

  moveInto(parent: AfterCommitBuffer): void {
    this.open = false;
    for (const action of this.actions.splice(0)) {
      parent.add(action);
    }
  }

  discard(): void {
    this.open = false;
    this.actions.length = 0;
  }

  async flush(): Promise<void> {
    this.open = false;
    for (const action of this.actions.splice(0)) {
      await action();
    }
  }
}
