import { useTranslation } from 'react-i18next'

export function SquadSaveStatus({ confirmed, total, failed }: { confirmed: number; total: number; failed: boolean }) {
  const { t } = useTranslation()
  return <>
    {total > 1 && <p role="status" className="academy-hint">{t('academy.squadSavesConfirmed', { count: confirmed, total })}</p>}
    {failed && <p role="alert" className="academy-error">{t('academy.remoteSaveError')}</p>}
  </>
}
