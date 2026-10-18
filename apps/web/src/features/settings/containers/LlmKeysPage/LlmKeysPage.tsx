import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLlmCatalog } from '@/features/settings/communication/hooks/useLlmCatalog';
import {
  LLM_NOTICE_ICON_SIZE,
  MOCK_LLM_KEYS,
} from '@/features/settings/constants/llmKey.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { AddLlmKeyDialog } from '@/features/settings/containers/AddLlmKeyDialog';
import type { LlmKeysPageProps } from '@/features/settings/containers/LlmKeysPage/LlmKeysPage.typedefs';
import { RemoveLlmKeyDialog } from '@/features/settings/containers/RemoveLlmKeyDialog';
import {
  firstVendorWithoutKey,
  llmKeyLast4,
} from '@/features/settings/logic/helpers/llmKey.helpers';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import type { LlmKey } from '@/features/settings/typedefs/llmKey.typedefs';
import { LlmKeyList } from '@/features/settings/view/LlmKeyList';
import type { LlmKeyRow } from '@/features/settings/view/LlmKeyList';
import { useActiveWorkspace, useWorkspaceShell } from '@/features/workspace';
import type { ModelVendor } from '@/shared/api/generated/schema.generated';
import { Button } from '@/shared/ui/actions/Button';
import { BadgeTone } from '@/shared/ui/display/Badge';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/containers/LlmKeysPage/LlmKeysPage.module.scss';

export function LlmKeysPage({ workspaceId }: LlmKeysPageProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { showToast } = useToast();
  const { providers, purposes } = useLlmCatalog();
  const active = useActiveWorkspace(workspaceId);
  const userName = useWorkspaceShell(workspaceId).data?.user.name ?? '';
  const [keys, setKeys] = useState<readonly LlmKey[]>(MOCK_LLM_KEYS);
  const [addVendor, setAddVendor] = useState<ModelVendor | null>(null);
  const [removeVendor, setRemoveVendor] = useState<ModelVendor | null>(null);

  const canEdit =
    active !== null &&
    can(active.role, PermissionResource.WorkspaceSettings, PermissionAction.Edit);

  const vendorLabel = (vendor: ModelVendor): string => t(`llmKeys.vendors.${vendor}`);

  const keySubtitle = (key: LlmKey): string =>
    [
      t('llmKeys.keyEnds', { last4: key.last4 }),
      t('llmKeys.addedBy', { name: userName }),
      key.usedBySteps > 0 ? t('llmKeys.usedBy', { count: key.usedBySteps }) : null,
    ]
      .filter((part) => part !== null)
      .join(' · ');

  const saveKey = (vendor: ModelVendor, rawKey: string) => {
    setKeys((current) => [
      ...current.filter((entry) => entry.vendor !== vendor),
      { vendor, last4: llmKeyLast4(rawKey), usedBySteps: 0 },
    ]);
    showToast({
      message: t('llmKeys.saved', { provider: vendorLabel(vendor) }),
      tone: ToastTone.Ok,
    });
  };

  const removeKey = (vendor: ModelVendor) => {
    setKeys((current) => current.filter((entry) => entry.vendor !== vendor));
    showToast({
      message: t('llmKeys.removed', { provider: vendorLabel(vendor) }),
      tone: ToastTone.Ok,
    });
  };

  const platformRow: LlmKeyRow = {
    id: 'platform',
    title: t('llmKeys.platform.title'),
    subtitle: t('llmKeys.platform.subtitle', {
      models: purposes.map((purpose) => t(`llmKeys.purposes.${purpose}`)).join(', '),
    }),
    badge: { label: t('llmKeys.platform.badge'), tone: BadgeTone.Accent, dot: false },
    addLabel: null,
    onAdd: null,
    removeLabel: null,
    onRemove: null,
  };

  const providerRows: readonly LlmKeyRow[] = providers.map((provider) => {
    const key = keys.find((entry) => entry.vendor === provider.vendor) ?? null;
    return {
      id: provider.vendor,
      title: vendorLabel(provider.vendor),
      subtitle: key === null ? t('llmKeys.noKey') : keySubtitle(key),
      badge: key === null ? null : { label: t('llmKeys.connected'), tone: BadgeTone.Ok, dot: true },
      addLabel: key === null ? t('llmKeys.add') : null,
      onAdd: key === null && canEdit ? () => setAddVendor(provider.vendor) : null,
      removeLabel: t('llmKeys.remove'),
      onRemove: key !== null && canEdit ? () => setRemoveVendor(provider.vendor) : null,
    };
  });

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('nav.llmKeys')}
        subtitle={t('llmKeys.subtitle')}
        crumbs={
          <Breadcrumb
            ariaLabel={t('breadcrumb')}
            moreLabel={t('breadcrumbMore')}
            items={[{ label: t('title'), to: settingsHref(workspaceId) }]}
          />
        }
        actions={
          canEdit ? (
            <Button
              icon={IconName.Plus}
              onClick={() => setAddVendor(firstVendorWithoutKey(providers, keys))}
            >
              {t('llmKeys.add')}
            </Button>
          ) : null
        }
      />
      <div className="flex flex-col gap-4 px-7">
        <LlmKeyList
          title={t('llmKeys.models.title')}
          description={t('llmKeys.models.description')}
          rows={[platformRow, ...providerRows]}
        />
        <div className={styles.notice}>
          <Icon name={IconName.Info} size={LLM_NOTICE_ICON_SIZE} className={styles.noticeIcon} />
          <Text kind={TextKind.BodySmall} color={TextColor.Mute}>
            {t('llmKeys.notice')}
          </Text>
        </div>
      </div>
      {addVendor !== null && (
        <AddLlmKeyDialog
          vendor={addVendor}
          providers={providers}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setAddVendor(null);
            }
          }}
          onSubmit={saveKey}
        />
      )}
      {removeVendor !== null && (
        <RemoveLlmKeyDialog
          provider={vendorLabel(removeVendor)}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setRemoveVendor(null);
            }
          }}
          onConfirm={() => removeKey(removeVendor)}
        />
      )}
    </div>
  );
}
