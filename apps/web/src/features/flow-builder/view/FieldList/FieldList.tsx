import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { ENUM_VALUES_SEPARATOR } from '@/features/flow-builder/constants/inspector.constants';
import type { FieldListProps } from '@/features/flow-builder/view/FieldList/FieldList.typedefs';
import { RowList } from '@/shared/ui/display/RowList';
import { InspectorSection } from '@/shared/ui/layout/Inspector';

export function FieldList({ title, rows }: FieldListProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

  const meta = (row: FieldListProps['rows'][number]) => {
    if (row.hint !== null) {
      return t(`inspector.hint.${row.hint}`);
    }
    return row.values === null
      ? t(`inspector.type.${row.type}`)
      : row.values.join(ENUM_VALUES_SEPARATOR);
  };

  return (
    <InspectorSection title={title}>
      <RowList
        aria-label={title}
        rows={rows.map((row) => ({ id: row.path, name: row.path, meta: meta(row) }))}
      />
    </InspectorSection>
  );
}
