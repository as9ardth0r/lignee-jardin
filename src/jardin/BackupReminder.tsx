/** Rappel de sauvegarde : date de la dernière sauvegarde exportée sur cet appareil, en orange après 14 jours. */
import { useState } from 'react';
import { diffDays } from './engine/dates';
import { fmtDate } from './format';
import { useJT } from './i18n';
import { useGarden } from './store';
import { Button, INK700 } from './ui';
import { downloadTextFile } from '../utils/download';

export const BACKUP_DAYS = 14;

export function useBackupAge(): number | null {
  const { data, today } = useGarden();
  return data.settings.lastBackup ? diffDays(data.settings.lastBackup, today) : null;
}

export function useExportBackup() {
  const store = useGarden();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      downloadTextFile(`lignee-jardin-${store.today}.json`, await store.exportBackup(), 'application/json');
    } finally {
      setBusy(false);
    }
  };
  return { run, busy };
}

/** Ligne d'état (réglages). */
export function BackupStatus() {
  const { data } = useGarden();
  const { tt, lang } = useJT();
  const age = useBackupAge();
  const late = age === null || age > BACKUP_DAYS;
  return (
    <p className="mt-2 rounded px-2.5 py-1.5 text-xs" data-testid="backup-status" style={late ? { background: '#f6e2c4', color: '#7a4a0c' } : { background: '#e6efdc', color: '#2f4a22' }}>
      💾 {age === null ? tt('backup.never') : tt('backup.last', { date: fmtDate(data.settings.lastBackup!, lang, true), days: age })}
      {late ? ` ${tt('backup.lateHint')}` : ''}
    </p>
  );
}

/** Bandeau dans « Aujourd'hui » quand la sauvegarde date de plus de 14 jours. */
export function BackupBanner() {
  const { data } = useGarden();
  const { tt } = useJT();
  const age = useBackupAge();
  const { run, busy } = useExportBackup();
  const hasData = data.beds.length + data.plants.length + data.seeds.length + (data.mushrooms ?? []).length > 0;
  if (!hasData || (age !== null && age <= BACKUP_DAYS)) return null;
  return (
    <div className="rounded-lg px-4 py-3" data-testid="backup-banner" style={{ background: '#f6e2c4', color: '#7a4a0c' }}>
      <p className="text-sm font-medium">💾 {age === null ? tt('backup.bannerNever') : tt('backup.bannerLate', { days: age })}</p>
      <p className="mt-0.5 text-xs" style={{ color: INK700 }}>
        {tt('backup.bannerHow')}
      </p>
      <div className="mt-2">
        <Button small kind="primary" onClick={run} disabled={busy}>
          ⬇ {tt('backup.now')}
        </Button>
      </div>
    </div>
  );
}
