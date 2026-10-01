import { useState } from 'react';
import type { GrowthStage, Individual, JournalEntry } from '../engine/genetics';
import { GROWTH_STAGES } from '../engine/genetics';
import { useTranslation } from '../i18n/LanguageContext';

interface Props {
  individual: Individual;
  onAddEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  onDeleteEntry: (entryId: string) => void;
  onExport: () => void;
}

function toDateInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Carnet de bord d'un spécimen — historique d'observations datées
 * (voir `JournalEntry` dans genetics.ts), le pendant structuré du
 * champ "notes" libre affiché juste au-dessus dans la fiche détaillée.
 * Pensé pour un suivi de culture sérieux : plusieurs entrées dans le
 * temps plutôt qu'un texte unique qu'on écrase, avec quelques champs
 * rapides (stade, hauteur, anomalies, actions) en plus du texte libre.
 */
export function SpecimenJournal({ individual, onAddEntry, onDeleteEntry, onExport }: Props) {
  const { t, language } = useTranslation();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => toDateInputValue(Date.now()));
  const [stage, setStage] = useState<GrowthStage | ''>('');
  const [heightCm, setHeightCm] = useState('');
  const [issues, setIssues] = useState('');
  const [actions, setActions] = useState('');
  const [text, setText] = useState('');

  const entries = [...(individual.journal ?? [])].sort((a, b) => b.date - a.date);
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  function reset() {
    setDate(toDateInputValue(Date.now()));
    setStage('');
    setHeightCm('');
    setIssues('');
    setActions('');
    setText('');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !issues.trim() && !actions.trim()) return;
    // La date choisie (jour) + l'heure actuelle, pour rester triable
    // même pour plusieurs entrées le même jour.
    const chosen = new Date(date);
    const now = new Date();
    chosen.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    onAddEntry({
      date: chosen.getTime(),
      stage: stage || undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      issues: issues.trim() || undefined,
      actions: actions.trim() || undefined,
      text: text.trim(),
    });
    reset();
    setOpen(false);
  }

  const inputStyle = { background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{ background: open ? 'var(--color-resin-500)' : 'var(--color-canopy-800)', color: open ? 'var(--color-ink-900)' : 'var(--color-paper-200)' }}
        >
          {open ? t('journal.form.cancel') : t('journal.form.open')}
        </button>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onExport}
            className="rounded px-2.5 py-1.5 text-xs transition-colors"
            style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}
          >
            {t('journal.export')}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-2 rounded p-3 mb-3" style={{ background: 'var(--color-canopy-900)' }}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] mb-1" style={{ color: 'var(--color-paper-300)' }} htmlFor="journal-date">
                {t('journal.form.date')}
              </label>
              <input
                id="journal-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded px-2 py-1.5 text-xs outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-[10px] mb-1" style={{ color: 'var(--color-paper-300)' }} htmlFor="journal-stage">
                {t('journal.form.stage')}
              </label>
              <select
                id="journal-stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as GrowthStage | '')}
                className="w-full rounded px-2 py-1.5 text-xs outline-none capitalize"
                style={inputStyle}
              >
                <option value="">{t('journal.form.stageUnset')}</option>
                {GROWTH_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] mb-1" style={{ color: 'var(--color-paper-300)' }} htmlFor="journal-height">
              {t('journal.form.height')}
            </label>
            <input
              id="journal-height"
              type="number"
              min={0}
              step="0.5"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder={t('journal.form.heightPlaceholder')}
              className="w-full rounded px-2 py-1.5 text-xs outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-[10px] mb-1" style={{ color: 'var(--color-paper-300)' }} htmlFor="journal-issues">
              {t('journal.form.issues')}
            </label>
            <input
              id="journal-issues"
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder={t('journal.form.issuesPlaceholder')}
              className="w-full rounded px-2 py-1.5 text-xs outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-[10px] mb-1" style={{ color: 'var(--color-paper-300)' }} htmlFor="journal-actions">
              {t('journal.form.actions')}
            </label>
            <input
              id="journal-actions"
              value={actions}
              onChange={(e) => setActions(e.target.value)}
              placeholder={t('journal.form.actionsPlaceholder')}
              className="w-full rounded px-2 py-1.5 text-xs outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-[10px] mb-1" style={{ color: 'var(--color-paper-300)' }} htmlFor="journal-text">
              {t('journal.form.text')}
            </label>
            <textarea
              id="journal-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('journal.form.textPlaceholder')}
              rows={3}
              className="w-full rounded px-2 py-1.5 text-xs outline-none resize-y"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded py-2 text-xs font-medium transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--color-leaf-500)', color: 'var(--color-ink-900)' }}
          >
            {t('journal.form.submit')}
          </button>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="text-xs italic" style={{ color: 'var(--color-ink-500)' }}>
          {t('journal.empty')}
        </p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded p-2.5 text-xs" style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="genotype-code" style={{ color: 'var(--color-resin-400)' }}>
                    {new Date(entry.date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  {entry.stage && (
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] capitalize" style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-200)' }}>
                      {entry.stage}
                    </span>
                  )}
                  {entry.heightCm != null && (
                    <span className="rounded-full px-1.5 py-0.5 text-[9px]" style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-200)' }}>
                      {entry.heightCm} cm
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteEntry(entry.id)}
                  className="shrink-0 text-[10px]"
                  style={{ color: 'var(--color-bloom-400)' }}
                  title={t('journal.deleteEntry')}
                >
                  ✕
                </button>
              </div>
              {entry.text && <p className="leading-relaxed" style={{ color: 'var(--color-paper-100)' }}>{entry.text}</p>}
              {entry.issues && (
                <p className="mt-1" style={{ color: 'var(--color-bloom-400)' }}>
                  ⚠ {entry.issues}
                </p>
              )}
              {entry.actions && (
                <p className="mt-1" style={{ color: 'var(--color-leaf-500)' }}>
                  → {entry.actions}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
