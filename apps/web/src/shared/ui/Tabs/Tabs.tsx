import clsx from 'clsx';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { TabsSize } from '@/shared/ui/Tabs/Tabs.constants';
import type { TabsProps } from '@/shared/ui/Tabs/Tabs.typedefs';
import styles from '@/shared/ui/Tabs/Tabs.module.scss';

export function Tabs<T extends string>({
  tabs,
  value,
  onValueChange,
  size = TabsSize.Page,
  ariaLabel = null,
  className,
}: TabsProps<T>) {
  const handleValueChange = (next: string) => {
    const tab = tabs.find((candidate) => candidate.value === next);
    if (tab !== undefined) {
      onValueChange(tab.value);
    }
  };

  return (
    <TabsPrimitive.Root value={value} onValueChange={handleValueChange}>
      <TabsPrimitive.List
        aria-label={ariaLabel ?? undefined}
        className={clsx(styles.list, styles[size], className)}
      >
        {tabs.map((tab) => {
          const disabled = tab.disabled ?? false;
          const href = tab.href ?? null;

          return href !== null && !disabled ? (
            <TabsPrimitive.Trigger key={tab.value} value={tab.value} asChild>
              <a href={href} className={styles.tab}>
                {tab.label}
              </a>
            </TabsPrimitive.Trigger>
          ) : (
            <TabsPrimitive.Trigger
              key={tab.value}
              value={tab.value}
              disabled={disabled}
              className={styles.tab}
            >
              {tab.label}
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
