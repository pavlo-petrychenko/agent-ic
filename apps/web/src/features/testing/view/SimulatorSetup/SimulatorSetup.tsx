import { useTranslation } from 'react-i18next';
import {
  SIMULATOR_CHANNELS,
  SIMULATOR_LANGUAGES,
} from '@/features/testing/constants/simulator.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type { SimulatorSetupProps } from '@/features/testing/view/SimulatorSetup/SimulatorSetup.typedefs';
import { Field } from '@/shared/ui/inputs/Field';
import { Select, SelectSize } from '@/shared/ui/inputs/Select';

export function SimulatorSetup({
  channelKind,
  language,
  onChannelKindChange,
  onLanguageChange,
}: SimulatorSetupProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label={t('setup.channel')}>
        {(control) => (
          <Select
            {...control}
            size={SelectSize.Sm}
            value={channelKind}
            options={SIMULATOR_CHANNELS.map((value) => ({ value, label: t(`channels.${value}`) }))}
            onChange={(event) => onChannelKindChange(event.target.value)}
          />
        )}
      </Field>
      <Field label={t('setup.language')}>
        {(control) => (
          <Select
            {...control}
            size={SelectSize.Sm}
            value={language}
            options={SIMULATOR_LANGUAGES.map((value) => ({
              value,
              label: t(`languages.${value}`),
            }))}
            onChange={(event) => onLanguageChange(event.target.value)}
          />
        )}
      </Field>
    </div>
  );
}
