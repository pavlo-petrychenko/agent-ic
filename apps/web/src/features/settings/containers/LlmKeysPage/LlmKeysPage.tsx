import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLlmCatalog } from '@/features/settings/communication/hooks/useLlmCatalog';
import { useLlmKeys } from '@/features/settings/communication/hooks/useLlmKeys';
import { useSetLlmKeyFallback } from '@/features/settings/communication/hooks/useSetLlmKeyFallback';
import {
  LLM_CUSTOM_ADD_ROW_ID,
  LLM_KEYS_SKELETON_ROWS,
  LLM_KNOWN_VENDOR_ORDER,
  LLM_NOTICE_ICON_SIZE,
  LLM_PLATFORM_ROW_ID,
} from '@/features/settings/constants/llmKey.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { AddLlmKeyDialog } from '@/features/settings/containers/AddLlmKeyDialog';
import type { LlmKeysPageProps } from '@/features/settings/containers/LlmKeysPage/LlmKeysPage.typedefs';
import { RemoveLlmKeyDialog } from '@/features/settings/containers/RemoveLlmKeyDialog';
import {
  firstVendorWithoutKey,
  llmKeyHost,
} from '@/features/settings/logic/helpers/llmKey.helpers';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import type { LlmKey } from '@/features/settings/typedefs/llmKey.typedefs';
import { LlmKeyList } from '@/features/settings/view/LlmKeyList';
import type { LlmKeyRow } from '@/features/settings/view/LlmKeyList';
import { useActiveWorkspace } from '@/features/workspace';
import { LlmKeyVendor } from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { BadgeTone } from '@/shared/ui/display/Badge';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import { Switch } from '@/shared/ui/inputs/Switch';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/containers/LlmKeysPage/LlmKeysPage.module.scss';

export function LlmKeysPage({ workspaceId }: LlmKeysPageProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { purposes } = useLlmCatalog();
  const { keys, loading, failed, retry } = useLlmKeys();
  const setFallback = useSetLlmKeyFallback();
  const active = useActiveWorkspace(workspaceId);
  const [addVendor, setAddVendor] = useState<LlmKeyVendor | null>(null);
  const [removeKey, setRemoveKey] = useState<LlmKey | null>(null);

  const canEdit =
    active !== null &&
    can(active.role, PermissionResource.WorkspaceSettings, PermissionAction.Edit);

  const keyLabel = (key: LlmKey): string =>
    key.vendor === LlmKeyVendor.Custom ? key.name : t(`llmKeys.vendors.${key.vendor}`);

  const keySubtitle = (key: LlmKey): string =>
    [
      key.vendor === LlmKeyVendor.Custom ? llmKeyHost(key.baseUrl) : null,
      t('llmKeys.keyEnds', { last4: key.keyLast4 }),
      t('llmKeys.addedBy', { name: key.addedBy }),
      key.usedBySteps > 0 ? t('llmKeys.usedBy', { count: key.usedBySteps }) : null,
    ]
      .filter((part) => part !== null)
      .join(' · ');

  const toggleFallback = async (key: LlmKey, enabled: boolean) => {
    try {
      await setFallback(key.id, enabled);
    } catch (caught) {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    }
  };

  const connectedRow = (key: LlmKey): LlmKeyRow => ({
    id: key.id,
    title: keyLabel(key),
    subtitle: keySubtitle(key),
    badge: { label: t('llmKeys.connected'), tone: BadgeTone.Ok, dot: true },
    control: (
      <Switch
        checked={key.fallbackToPlatform}
        disabled={!canEdit}
        label={t('llmKeys.fallback')}
        onCheckedChange={(enabled) => void toggleFallback(key, enabled)}
      />
    ),
    addLabel: null,
    onAdd: null,
    removeLabel: t('llmKeys.remove'),
    onRemove: canEdit ? () => setRemoveKey(key) : null,
  });

  const platformRow: LlmKeyRow = {
    id: LLM_PLATFORM_ROW_ID,
    title: t('llmKeys.platform.title'),
    subtitle: t('llmKeys.platform.subtitle', {
      models: purposes.map((purpose) => t(`llmKeys.purposes.${purpose}`)).join(', '),
    }),
    badge: { label: t('llmKeys.platform.badge'), tone: BadgeTone.Accent, dot: false },
    control: null,
    addLabel: null,
    onAdd: null,
    removeLabel: null,
    onRemove: null,
  };

  const vendorRows: readonly LlmKeyRow[] = LLM_KNOWN_VENDOR_ORDER.map((vendor) => {
    const key = keys.find((entry) => entry.vendor === vendor) ?? null;
    if (key !== null) {
      return connectedRow(key);
    }
    return {
      id: vendor,
      title: t(`llmKeys.vendors.${vendor}`),
      subtitle: t('llmKeys.noKey'),
      badge: null,
      control: null,
      addLabel: t('llmKeys.add'),
      onAdd: canEdit ? () => setAddVendor(vendor) : null,
      removeLabel: null,
      onRemove: null,
    };
  });

  const customRows: readonly LlmKeyRow[] = keys
    .filter((key) => key.vendor === LlmKeyVendor.Custom)
    .map(connectedRow);

  const addCustomRow: LlmKeyRow = {
    id: LLM_CUSTOM_ADD_ROW_ID,
    title: t('llmKeys.vendors.custom'),
    subtitle: t('llmKeys.custom.subtitle'),
    badge: null,
    control: null,
    addLabel: t('llmKeys.custom.add'),
    onAdd: canEdit ? () => setAddVendor(LlmKeyVendor.Custom) : null,
    removeLabel: null,
    onRemove: null,
  };

  const rows: readonly LlmKeyRow[] = [platformRow, ...vendorRows, ...customRows, addCustomRow];

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
            <Button icon={IconName.Plus} onClick={() => setAddVendor(firstVendorWithoutKey(keys))}>
              {t('llmKeys.add')}
            </Button>
          ) : null
        }
      />
      <div className="flex flex-col gap-4 px-7">
        {failed ? (
          <Callout
            tone={CalloutTone.Err}
            action={
              <Button variant={ButtonVariant.Secondary} onClick={retry}>
                {t('llmKeys.retry')}
              </Button>
            }
          >
            {t('llmKeys.loadFailed')}
          </Callout>
        ) : loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: LLM_KEYS_SKELETON_ROWS }, (_, index) => (
              <Skeleton key={index} label={t('llmKeys.loading')} />
            ))}
          </div>
        ) : (
          <LlmKeyList
            title={t('llmKeys.models.title')}
            description={t('llmKeys.models.description')}
            rows={rows}
          />
        )}
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
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setAddVendor(null);
            }
          }}
        />
      )}
      {removeKey !== null && (
        <RemoveLlmKeyDialog
          llmKey={removeKey}
          provider={keyLabel(removeKey)}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setRemoveKey(null);
            }
          }}
        />
      )}
    </div>
  );
}
