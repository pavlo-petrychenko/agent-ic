import { AGENT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { NameFieldKey } from '@/features/flow-builder/constants/nameField.constants';
import type { AgentNameFieldProps } from '@/features/flow-builder/view/AgentNameField/AgentNameField.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Input } from '@/shared/ui/inputs/Input';

export function AgentNameField({ name, onRename }: AgentNameFieldProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    const next = draft?.trim() ?? '';
    setDraft(null);
    if (next !== '' && next !== name) {
      onRename(next);
    }
  };

  return draft === null ? (
    <Button variant={ButtonVariant.Ghost} title={t('header.rename')} onClick={() => setDraft(name)}>
      {name}
    </Button>
  ) : (
    <Input
      aria-label={t('header.nameLabel')}
      value={draft}
      maxLength={AGENT_NAME_MAX_LENGTH}
      ref={(element) => element?.focus()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === NameFieldKey.Commit) {
          commit();
        }
        if (event.key === NameFieldKey.Cancel) {
          setDraft(null);
        }
      }}
    />
  );
}
