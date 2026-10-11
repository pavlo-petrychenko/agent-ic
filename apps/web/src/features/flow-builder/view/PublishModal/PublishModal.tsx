import { AGENT_VERSION_NOTE_MAX_LENGTH } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { CHECK_TILE } from '@/features/flow-builder/view/PublishModal/PublishModal.constants';
import type { PublishModalProps } from '@/features/flow-builder/view/PublishModal/PublishModal.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { DiffLine } from '@/shared/ui/display/DiffLine';
import { NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import { RowList } from '@/shared/ui/display/RowList';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/flow-builder/view/PublishModal/PublishModal.module.scss';

export function PublishModal({
  title,
  version,
  liveVersion,
  changesTitle,
  changes,
  checks,
  note,
  summary,
  publishLabel,
  canPublish,
  loading,
  failed,
  publishing,
  error,
  onNoteChange,
  onRetry,
  onFix,
  onPublish,
  onClose,
}: PublishModalProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const caption = (text: string) => (
    <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
      {text}
    </Text>
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      busy={publishing}
      error={error}
      title={title}
      closeLabel={t('publish.close')}
      size={DialogSize.Lg}
      footerLeft={summary === null ? null : caption(summary)}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={publishing} onClick={onClose}>
            {t('publish.cancel')}
          </Button>
          <Button disabled={!canPublish} loading={publishing} onClick={onPublish}>
            {publishLabel}
          </Button>
        </>
      }
    >
      {loading && <Skeleton label={t('publish.loading')} />}
      {failed && (
        <Callout
          tone={CalloutTone.Err}
          action={
            <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={onRetry}>
              {t('retry')}
            </Button>
          }
        >
          {t('publish.loadError')}
        </Callout>
      )}
      {!loading && !failed && (
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-1.5">
            {caption(changesTitle)}
            {changes.length === 0 ? (
              <Text kind={TextKind.BodySmall} color={TextColor.Ink2}>
                {t('publish.noChanges')}
              </Text>
            ) : (
              <ul className={styles.changes}>
                {changes.map((change) => (
                  <DiffLine
                    key={change.id}
                    sign={change.sign}
                    signLabel={t(`publish.sign.${change.sign}`)}
                  >
                    {change.text}
                  </DiffLine>
                ))}
              </ul>
            )}
          </section>
          <section className="flex flex-col gap-1.5">
            {caption(t('publish.checks'))}
            <RowList
              mono={false}
              rows={checks.map((check) => ({
                id: check.id,
                name: check.label,
                leading: (
                  <NodeTile
                    kind={CHECK_TILE[check.tone].kind}
                    icon={CHECK_TILE[check.tone].icon}
                    size={TileSize.Sm}
                  />
                ),
                meta:
                  check.nodeId === null ? (
                    check.meta
                  ) : (
                    <Button
                      variant={ButtonVariant.Ghost}
                      size={ButtonSize.Sm}
                      onClick={() => check.nodeId !== null && onFix(check.nodeId)}
                    >
                      {t('publish.fix')}
                    </Button>
                  ),
              }))}
            />
          </section>
          <Field label={t('publish.note')}>
            {(control) => (
              <Input
                {...control}
                value={note}
                maxLength={AGENT_VERSION_NOTE_MAX_LENGTH}
                placeholder={t('publish.notePlaceholder')}
                onChange={(event) => onNoteChange(event.target.value)}
              />
            )}
          </Field>
          <Callout tone={CalloutTone.Info}>
            {liveVersion === null
              ? t('publish.goesLiveFirst', { version })
              : t('publish.goesLive', { version, live: liveVersion })}
          </Callout>
        </div>
      )}
    </Dialog>
  );
}
