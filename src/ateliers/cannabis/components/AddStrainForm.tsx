import { useState } from 'react';
import type { ChemotypeId, Difficulty, Environment, StrainPreset, TempPreference } from '../engine/genetics';
import { CHEMOTYPES } from '../engine/genetics';
import { SeedCheckbox } from './FounderForm';
import { useTranslation } from '../i18n/LanguageContext';

interface Props {
  /** Construit l'id (slug unique contre le catalogue existant + les
   * souches perso déjà enregistrées) — délégué au parent, qui connaît
   * la liste complète des souches perso. */
  makeId: (name: string) => string;
  onCreate: (preset: StrainPreset) => void;
}

const chemotypeOrder: ChemotypeId[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const tempOrder: TempPreference[] = ['fraîche', 'tempérée', 'chaude'];
const difficultyOrder: Difficulty[] = ['débutant', 'intermédiaire', 'avancé'];
const environmentOrder: Environment[] = ['intérieur', 'extérieur', 'intérieur/extérieur'];

const emptyFields = {
  name: '',
  chemotype: 'I' as ChemotypeId,
  autoflower: false,
  violet: false,
  description: '',
  origin: '',
  climate: '',
  tempPreference: 'tempérée' as TempPreference,
  floweringMin: '',
  floweringMax: '',
  totalMin: '',
  totalMax: '',
  heightRange: '',
  difficulty: 'intermédiaire' as Difficulty,
  environment: 'intérieur/extérieur' as Environment,
};

export function AddStrainForm({ makeId, onCreate }: Props) {
  const { t } = useTranslation();
  const [fields, setFields] = useState(emptyFields);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof emptyFields>(key: K, value: (typeof emptyFields)[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setFields(emptyFields);
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = fields.name.trim();
    if (!name) {
      setError(t('addStrainForm.error.nameRequired'));
      return;
    }
    const floweringMin = Number(fields.floweringMin);
    const floweringMax = Number(fields.floweringMax) || floweringMin;
    if (!fields.floweringMin || Number.isNaN(floweringMin) || floweringMin <= 0) {
      setError(t('addStrainForm.error.floweringRequired'));
      return;
    }
    const totalMinRaw = fields.totalMin ? Number(fields.totalMin) : floweringMin + 4;
    const totalMaxRaw = fields.totalMax ? Number(fields.totalMax) : Math.max(totalMinRaw, floweringMax + 4);

    const preset: StrainPreset = {
      id: makeId(name),
      name,
      chemotype: fields.chemotype,
      autoflower: fields.autoflower,
      violet: fields.violet,
      description: fields.description.trim() || t('addStrainForm.defaultDescription', { chemotype: CHEMOTYPES[fields.chemotype].label }),
      info: {
        origin: fields.origin.trim() || t('addStrainForm.defaultOrigin'),
        climate: fields.climate.trim() || fields.environment,
        tempPreference: fields.tempPreference,
        floweringWeeks: [Math.min(floweringMin, floweringMax), Math.max(floweringMin, floweringMax)],
        totalCycleWeeks: [Math.min(totalMinRaw, totalMaxRaw), Math.max(totalMinRaw, totalMaxRaw)],
        heightRange: fields.heightRange.trim() || t('addStrainForm.defaultHeight'),
        difficulty: fields.difficulty,
        environment: fields.environment,
      },
    };

    onCreate(preset);
    reset();
  }

  const inputStyle = {
    background: 'var(--color-canopy-800)',
    color: 'var(--color-paper-100)',
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
        {t('addStrainForm.intro')}
      </p>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }} htmlFor="add-strain-name">
          {t('addStrainForm.name.label')}
        </label>
        <input
          id="add-strain-name"
          value={fields.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={t('addStrainForm.name.placeholder')}
          className="w-full rounded px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
          {t('founderForm.chemotype.label')}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {chemotypeOrder.map((id) => (
            <button
              type="button"
              key={id}
              onClick={() => set('chemotype', id)}
              className="rounded px-1.5 py-2 text-xs leading-tight transition-colors break-words hyphens-auto"
              style={{
                background: fields.chemotype === id ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                color: fields.chemotype === id ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
              }}
              title={CHEMOTYPES[id].description}
            >
              <span className="block font-medium">{id}</span>
              <span className="block opacity-80 text-[10px]">{CHEMOTYPES[id].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <SeedCheckbox
          checked={fields.autoflower}
          onChange={(v) => set('autoflower', v)}
          accent="var(--color-resin-500)"
          label={t('founderForm.autoflowerCheckbox')}
        />
        <SeedCheckbox
          checked={fields.violet}
          onChange={(v) => set('violet', v)}
          accent="var(--color-bloom-500)"
          label={t('founderForm.violetCheckbox')}
        />
      </div>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }} htmlFor="add-strain-desc">
          {t('addStrainForm.description.label')}
        </label>
        <input
          id="add-strain-desc"
          value={fields.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('addStrainForm.description.placeholder')}
          className="w-full rounded px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }} htmlFor="add-strain-origin">
            {t('addStrainForm.origin.label')}
          </label>
          <input
            id="add-strain-origin"
            value={fields.origin}
            onChange={(e) => set('origin', e.target.value)}
            placeholder={t('addStrainForm.origin.placeholder')}
            className="w-full rounded px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }} htmlFor="add-strain-climate">
            {t('addStrainForm.climate.label')}
          </label>
          <input
            id="add-strain-climate"
            value={fields.climate}
            onChange={(e) => set('climate', e.target.value)}
            placeholder={t('addStrainForm.climate.placeholder')}
            className="w-full rounded px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
          {t('addStrainForm.tempPreference.label')}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {tempOrder.map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => set('tempPreference', v)}
              className="rounded px-2 py-1.5 text-xs capitalize transition-colors"
              style={{
                background: fields.tempPreference === v ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                color: fields.tempPreference === v ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
            {t('addStrainForm.floweringWeeks.label')}
          </p>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              value={fields.floweringMin}
              onChange={(e) => set('floweringMin', e.target.value)}
              placeholder={t('addStrainForm.min')}
              className="w-full rounded px-2 py-2 text-sm outline-none"
              style={inputStyle}
            />
            <span className="text-xs" style={{ color: 'var(--color-paper-300)' }}>
              –
            </span>
            <input
              type="number"
              min={1}
              value={fields.floweringMax}
              onChange={(e) => set('floweringMax', e.target.value)}
              placeholder={t('addStrainForm.max')}
              className="w-full rounded px-2 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
            {t('addStrainForm.totalCycleWeeks.label')}
          </p>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              value={fields.totalMin}
              onChange={(e) => set('totalMin', e.target.value)}
              placeholder={t('addStrainForm.auto')}
              className="w-full rounded px-2 py-2 text-sm outline-none"
              style={inputStyle}
            />
            <span className="text-xs" style={{ color: 'var(--color-paper-300)' }}>
              –
            </span>
            <input
              type="number"
              min={1}
              value={fields.totalMax}
              onChange={(e) => set('totalMax', e.target.value)}
              placeholder={t('addStrainForm.auto')}
              className="w-full rounded px-2 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }} htmlFor="add-strain-height">
          {t('addStrainForm.heightRange.label')}
        </label>
        <input
          id="add-strain-height"
          value={fields.heightRange}
          onChange={(e) => set('heightRange', e.target.value)}
          placeholder={t('addStrainForm.heightRange.placeholder')}
          className="w-full rounded px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
          {t('addStrainForm.difficulty.label')}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {difficultyOrder.map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => set('difficulty', v)}
              className="rounded px-2 py-1.5 text-xs capitalize transition-colors"
              style={{
                background: fields.difficulty === v ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                color: fields.difficulty === v ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
          {t('addStrainForm.environment.label')}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {environmentOrder.map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => set('environment', v)}
              className="rounded px-1.5 py-1.5 text-[11px] leading-tight capitalize transition-colors"
              style={{
                background: fields.environment === v ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                color: fields.environment === v ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--color-bloom-400)' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
        style={{ background: 'var(--color-leaf-500)', color: 'var(--color-ink-900)' }}
      >
        {t('addStrainForm.submitButton')}
      </button>
    </form>
  );
}
