import { useMemo, useState } from 'react';
import type { ChemotypeId, Sex, StrainInfo, StrainPreset } from '../engine/genetics';
import { ALL_STRAIN_PRESETS, CHEMOTYPES, parseCannabinoidRates, formatCannabinoidRates } from '../engine/genetics';
import { StrainInfoPanel } from './StrainInfoPanel';
import { VarietyPicker } from './VarietyPicker';
import { useTranslation } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';

interface Props {
  /** Souches ajoutées à la main par l'utilisateur (page "Ajouter une
   * souche") — proposées en tête de la recherche de variété, au même
   * titre que le catalogue intégré. */
  customStrains?: StrainPreset[];
  onCreate: (opts: {
    chemotype: ChemotypeId;
    sex: Sex;
    autoflower: boolean;
    violet: boolean;
    propylVariant: boolean;
    reversedFemale: boolean;
    label: string;
    strainInfo?: StrainInfo;
    presetLabel?: string;
  }) => void;
}

const chemotypeOrder: ChemotypeId[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const shortDescriptionKey: Record<ChemotypeId, TranslationKey> = {
  I: 'founderForm.chemotype.short.I',
  II: 'founderForm.chemotype.short.II',
  III: 'founderForm.chemotype.short.III',
  IV: 'founderForm.chemotype.short.IV',
  V: 'founderForm.chemotype.short.V',
  VI: 'founderForm.chemotype.short.VI',
};

export function FounderForm({ customStrains = [], onCreate }: Props) {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<StrainPreset | null>(null);
  const allPresets = useMemo(() => [...customStrains, ...ALL_STRAIN_PRESETS], [customStrains]);
  const [chemotype, setChemotype] = useState<ChemotypeId>('I');
  const [sex, setSex] = useState<Sex>('F');
  const [autoflower, setAutoflower] = useState(false);
  const [violet, setViolet] = useState(false);
  const [propylVariant, setPropylVariant] = useState(false);
  const [reversedFemale, setReversedFemale] = useState(false);
  const [label, setLabel] = useState('');

  function applyPreset(p: StrainPreset) {
    setPreset(p);
    setChemotype(p.chemotype);
    setAutoflower(p.autoflower);
    setViolet(p.violet);
    setPropylVariant(false);
    setLabel(p.name);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({
          chemotype,
          sex,
          autoflower,
          violet,
          propylVariant,
          reversedFemale: sex === 'F' && reversedFemale,
          label: label.trim(),
          strainInfo: preset?.info,
          presetLabel: preset?.name,
        });
        setLabel('');
        setPreset(null);
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
          {t('founderForm.variety.label')}
        </label>
        <VarietyPicker
          allPresets={allPresets}
          selected={preset}
          onSelect={applyPreset}
          onClear={() => setPreset(null)}
        />
        {preset && (
          <div
            className="mt-2 rounded p-3"
            style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
          >
            <p className="text-xs italic mb-2" style={{ color: 'var(--color-paper-300)' }}>
              {preset.description}
            </p>
            {(() => {
              const rates = formatCannabinoidRates(parseCannabinoidRates(preset.description));
              return (
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-resin-400)' }}>
                  {rates ??
                    `${CHEMOTYPES[preset.chemotype].label} (${CHEMOTYPES[preset.chemotype].description}) — ${t('founderForm.variety.exactRateUnpublished')}`}
                </p>
              );
            })()}
            {preset.info ? (
              <StrainInfoPanel info={preset.info} compact />
            ) : (
              <p className="text-xs" style={{ color: 'var(--color-paper-300)' }}>
                {t('founderForm.variety.openLibraryNote', { chemotype: CHEMOTYPES[preset.chemotype].label })}
              </p>
            )}
          </div>
        )}
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
              onClick={() => {
                setChemotype(id);
                setPreset(null);
              }}
              className="rounded px-1.5 py-2 text-xs leading-tight transition-colors break-words hyphens-auto"
              style={{
                background: chemotype === id ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                color: chemotype === id ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
              }}
              title={CHEMOTYPES[id].description}
            >
              <span className="block font-medium">{id}</span>
              <span className="block opacity-80 text-[10px]">{t(shortDescriptionKey[id])}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
          {t('founderForm.sex.label')}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {(['F', 'M'] as Sex[]).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => {
                setSex(s);
                if (s === 'M') setReversedFemale(false);
              }}
              className="rounded px-2 py-2 text-sm transition-colors"
              style={{
                background: sex === s ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                color: sex === s ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
              }}
            >
              {s === 'F' ? t('founderForm.sex.female') : t('founderForm.sex.male')}
            </button>
          ))}
        </div>
        {sex === 'F' && (
          <SeedCheckbox
            checked={reversedFemale}
            onChange={setReversedFemale}
            accent="var(--color-leaf-500)"
            label={t('founderForm.reversedFemaleCheckbox')}
          />
        )}
      </div>

      <div className="space-y-2">
        <SeedCheckbox
          checked={autoflower}
          onChange={(v) => {
            setAutoflower(v);
            setPreset(null);
          }}
          accent="var(--color-resin-500)"
          label={t('founderForm.autoflowerCheckbox')}
        />
        <SeedCheckbox
          checked={violet}
          onChange={(v) => {
            setViolet(v);
            setPreset(null);
          }}
          accent="var(--color-bloom-500)"
          label={t('founderForm.violetCheckbox')}
        />
        <SeedCheckbox
          checked={propylVariant}
          onChange={(v) => {
            setPropylVariant(v);
            setPreset(null);
          }}
          accent="var(--color-leaf-500)"
          label={t('founderForm.propylCheckbox')}
        />
      </div>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }} htmlFor="founder-label">
          {t('founderForm.name.label')}
        </label>
        <input
          id="founder-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('founderForm.name.placeholder')}
          className="w-full rounded px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
        style={{ background: 'var(--color-leaf-500)', color: 'var(--color-ink-900)' }}
      >
        {t('founderForm.submitButton')}
      </button>
    </form>
  );
}

/** Case à cocher dessinée dans le même langage graphique que le reste
 * du formulaire (pastille + coche) plutôt que la case native du
 * navigateur, qui détonnait dans l'interface. Exportée pour être
 * réutilisée par AddStrainForm (même style visuel). */
export function SeedCheckbox({
  checked,
  onChange,
  accent,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  accent: string;
  label: string;
}) {
  return (
    <label
      className="flex items-center gap-2.5 text-sm cursor-pointer select-none"
      style={{ color: 'var(--color-ink-700)' }}
    >
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-[3px]"
          style={{
            background: checked ? accent : 'var(--color-paper-300)',
            boxShadow: checked ? 'none' : 'inset 0 0 0 1px var(--color-ink-500)',
          }}
        />
        <svg
          viewBox="0 0 16 16"
          className="pointer-events-none absolute inset-0 h-full w-full p-[3px]"
          style={{ opacity: checked ? 1 : 0 }}
        >
          <path
            d="M3 8.5 L6.5 12 L13 4.5"
            fill="none"
            stroke="var(--color-ink-900)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label}
    </label>
  );
}
