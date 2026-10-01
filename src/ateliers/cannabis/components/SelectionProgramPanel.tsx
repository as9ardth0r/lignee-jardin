import { useRef, useState } from 'react';
import type { BreedingEngine, ChemotypeId, Individual, TerpeneKey } from '../engine/genetics';
import { CHEMOTYPES } from '../engine/genetics';
import { useTranslation } from '../i18n/LanguageContext';
import { ProgramPedigreeDiagram, exportPedigreePng } from './ProgramPedigreeDiagram';
import {
  formatProgramAsText,
  programToJson,
  runSelectionProgram,
  type SelectionGoal,
  type SelectionProgramResult,
  type TraitTarget,
} from '../engine/selectionProgram';
import { deleteGoalPreset, loadGoalPresets, saveGoalPreset, type GoalPreset } from '../engine/goalPresets';

/** Durée de cycle (semaines) à défaut quand le fondateur n'a pas de
 * fiche de culture vérifiée (fondateur personnalisé, sans
 * `strainInfo`) — valeur médiane raisonnable pour un cycle indoor à
 * photopériode. */
const DEFAULT_CYCLE_WEEKS = 14;
/** Graines recommandées par génération pour repérer l'élite d'une
 * portée sans y consacrer un espace de culture excessif — voir
 * l'explication donnée à l'utilisateur : 24 (litterSize du moteur)
 * est un échantillon de simulation, pas une recommandation de
 * culture réelle. */
const RECOMMENDED_SEEDS_PER_GENERATION = 10;
/** Taux de germination typique pour des graines de qualité
 * correctement stockées (~85-90% en pratique culturale, hors graines
 * anciennes ou mal conservées) — sert à convertir "semis exploitables
 * visés" en "graines à acquérir/planter réellement", ces deux
 * nombres n'étant pas les mêmes en pratique. */
const GERMINATION_RATE = 0.85;

function founderCycleWeeks(ind: Individual | null): number {
  const range = ind?.strainInfo?.totalCycleWeeks;
  if (!range) return DEFAULT_CYCLE_WEEKS;
  return (range[0] + range[1]) / 2;
}

interface Props {
  parentA: Individual | null;
  parentB: Individual | null;
  engine: BreedingEngine;
  onProgramComplete: (result: SelectionProgramResult) => void;
}

const chemotypeOrder: ChemotypeId[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const terpeneOrder: TerpeneKey[] = ['myrcene', 'limonene', 'pinene', 'linalool', 'terpinolene', 'caryophyllene'];

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SelectionProgramPanel({ parentA, parentB, engine, onProgramComplete }: Props) {
  const { t, tEnum } = useTranslation();
  const pedigreeSvgRef = useRef<SVGSVGElement>(null);
  const [chemotype, setChemotype] = useState<ChemotypeId>('III');
  const [minCbdPercent, setMinCbdPercent] = useState(20);
  const [minThcPercent, setMinThcPercent] = useState(0);
  const [minCbgPercent, setMinCbgPercent] = useState(0);
  const [minCbcPercent, setMinCbcPercent] = useState(0);
  const [autoflower, setAutoflower] = useState(false);
  const [violet, setViolet] = useState(false);
  const [varin, setVarin] = useState(false);
  // Purement informatif — n'affecte pas l'algorithme (l'élite retenue
  // reste basée sur le phénotype complet simulé), juste l'affichage
  // de l'intérêt pratique d'un tri génétique précoce (voir
  // `mendelianPassRate` dans selectionProgram.ts).
  const [showMarkerAssisted, setShowMarkerAssisted] = useState(false);
  const [height, setHeight] = useState<TraitTarget>(null);
  const [coldTolerance, setColdTolerance] = useState<TraitTarget>(null);
  const [sunTolerance, setSunTolerance] = useState<TraitTarget>(null);
  const [moldResistance, setMoldResistance] = useState<TraitTarget>(null);
  const [terpeneTarget, setTerpeneTarget] = useState<TerpeneKey | null>(null);
  // Date de départ réelle (optionnelle) pour convertir la durée en
  // semaines du programme en dates calendaires concrètes plutôt qu'un
  // simple décompte relatif — chaîne ISO (yyyy-mm-dd) liée directement
  // à un <input type="date">.
  const [startDate, setStartDate] = useState('');
  const [presets, setPresets] = useState<GoalPreset[]>(() => loadGoalPresets());
  const [result, setResult] = useState<SelectionProgramResult | null>(null);
  // Run précédent (avant écrasement par le nouveau) — permet une
  // comparaison rapide entre deux réglages/tentatives sans avoir à
  // rouvrir les exports .txt/.json des deux runs séparément.
  const [previousResult, setPreviousResult] = useState<SelectionProgramResult | null>(null);
  const [running, setRunning] = useState(false);

  const ready = Boolean(parentA && parentB);

  function buildGoal(): SelectionGoal {
    return {
      chemotype,
      // Les seuils CBD/THC ne s'appliquent qu'aux chimiotypes I/II/III
      // (thc = cbd = 0 par construction en IV/V/VI) — on les met à 0
      // (indifférent) plutôt que de laisser un ancien réglage inatteignable.
      minCbd: chemotype === 'IV' || chemotype === 'V' || chemotype === 'VI' ? 0 : minCbdPercent / 100,
      minThc: chemotype === 'IV' || chemotype === 'V' || chemotype === 'VI' ? 0 : minThcPercent / 100,
      minCbgPercent: chemotype === 'IV' ? minCbgPercent : 0,
      minCbcPercent: chemotype === 'VI' ? minCbcPercent : 0,
      autoflower,
      violet,
      varin,
      height,
      coldTolerance,
      sunTolerance,
      moldResistance,
      terpeneTarget,
    };
  }

  function applyGoal(goal: SelectionGoal) {
    setChemotype(goal.chemotype);
    setMinCbdPercent(Math.round(goal.minCbd * 100));
    setMinThcPercent(Math.round(goal.minThc * 100));
    setMinCbgPercent(goal.minCbgPercent);
    setMinCbcPercent(goal.minCbcPercent);
    setAutoflower(goal.autoflower);
    setViolet(goal.violet);
    setVarin(goal.varin);
    setHeight(goal.height);
    setColdTolerance(goal.coldTolerance);
    setSunTolerance(goal.sunTolerance);
    setMoldResistance(goal.moldResistance);
    setTerpeneTarget(goal.terpeneTarget);
  }

  function handleSavePreset() {
    const name = window.prompt('Nom du préréglage :');
    if (!name || !name.trim()) return;
    setPresets(saveGoalPreset(name.trim(), buildGoal()));
  }

  function handleDeletePreset(id: string) {
    setPresets(deleteGoalPreset(id));
  }

  function run() {
    if (!parentA || !parentB) return;
    setRunning(true);
    const goal = buildGoal();
    // Synchrone (petits volumes) — le setTimeout laisse le temps au
    // bouton d'afficher son état "en cours" avant le calcul.
    setTimeout(() => {
      const r = runSelectionProgram(engine, parentA, parentB, goal);
      setResult((prev) => {
        setPreviousResult(prev);
        return r;
      });
      onProgramComplete(r);
      setRunning(false);
    }, 10);
  }

  function exportTxt() {
    if (!result || !parentA || !parentB) return;
    downloadTextFile('lignee-programme.txt', formatProgramAsText(engine, parentA, parentB, result, buildGoal()), 'text/plain');
  }

  function exportJson() {
    if (!result || !parentA || !parentB) return;
    downloadTextFile(
      'lignee-programme.json',
      JSON.stringify(programToJson(engine, parentA, parentB, result, buildGoal()), null, 2),
      'application/json'
    );
  }

  return (
    <div className="specimen-card p-5">
      <p className="font-display text-xl mb-1">{t('selectionProgram.title')}</p>
      <p className="text-xs mb-4" style={{ color: 'var(--color-ink-500)' }}>
        {t('selectionProgram.description')}
      </p>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4">
        <ParentSlot individual={parentA} engine={engine} />
        <span className="font-display text-2xl" style={{ color: 'var(--color-resin-500)' }}>
          ×
        </span>
        <ParentSlot individual={parentB} engine={engine} />
      </div>

      <div className="mb-4 rounded p-2.5" style={{ background: 'var(--color-canopy-800)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-ink-500)' }}>
            Préréglages d'objectifs
          </p>
          <button
            type="button"
            onClick={handleSavePreset}
            className="rounded px-2 py-1 text-[10px] font-medium transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--color-resin-500)', color: 'var(--color-ink-900)' }}
          >
            💾 Enregistrer l'objectif actuel
          </button>
        </div>
        {presets.length === 0 ? (
          <p className="text-[11px] italic" style={{ color: 'var(--color-ink-500)' }}>
            Aucun préréglage enregistré pour l'instant.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1 rounded px-2 py-1 text-[11px]"
                style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-200)' }}
              >
                <button type="button" onClick={() => applyGoal(p.goal)} className="hover:underline">
                  {p.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePreset(p.id)}
                  title="Supprimer ce préréglage"
                  style={{ color: 'var(--color-bloom-400)' }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
            {t('selectionProgram.targetChemotype.label')}
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {chemotypeOrder.map((id) => (
              <button
                type="button"
                key={id}
                onClick={() => setChemotype(id)}
                className="rounded px-1 py-2 text-xs leading-tight transition-colors"
                title={CHEMOTYPES[id].description}
                style={{
                  background: chemotype === id ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                  color: chemotype === id ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
                }}
              >
                {id}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--color-ink-500)' }}>
            {CHEMOTYPES[chemotype].description}
          </p>
        </div>

        {chemotype !== 'IV' && chemotype !== 'V' && chemotype !== 'VI' && (
          <>
            <div>
              <label className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
                <span>{t('selectionProgram.minCbd.label')}</span>
                <span className="genotype-code">{minCbdPercent === 0 ? t('selectionProgram.indifferent') : `${minCbdPercent}%`}</span>
              </label>
              <input
                type="range"
                min={0}
                max={28}
                step={1}
                value={minCbdPercent}
                onChange={(e) => setMinCbdPercent(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
                <span>{t('selectionProgram.minThc.label')}</span>
                <span className="genotype-code">{minThcPercent === 0 ? t('selectionProgram.indifferent') : `${minThcPercent}%`}</span>
              </label>
              <input
                type="range"
                min={0}
                max={28}
                step={1}
                value={minThcPercent}
                onChange={(e) => setMinThcPercent(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}

        {chemotype === 'IV' && (
          <div>
            <label className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
              <span>{t('selectionProgram.minCbg.label')}</span>
              <span className="genotype-code">{minCbgPercent === 0 ? t('selectionProgram.indifferent') : `${minCbgPercent}%`}</span>
            </label>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={minCbgPercent}
              onChange={(e) => setMinCbgPercent(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {chemotype === 'VI' && (
          <div>
            <label className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
              <span>{t('selectionProgram.minCbc.label')}</span>
              <span className="genotype-code">{minCbcPercent === 0 ? t('selectionProgram.indifferent') : `${minCbcPercent}%`}</span>
            </label>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={minCbcPercent}
              onChange={(e) => setMinCbcPercent(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        {chemotype === 'V' && (
          <p className="text-xs rounded p-2" style={{ background: 'var(--color-canopy-800)', color: 'var(--color-ink-500)' }}>
            {t('selectionProgram.chemotypeVNote')}
          </p>
        )}

        <div className="space-y-2">
          <GoalCheckbox checked={autoflower} onChange={setAutoflower} accent="var(--color-resin-500)" label={t('selectionProgram.autoflowerCheckbox')} />
          <GoalCheckbox
            checked={violet}
            onChange={setViolet}
            accent="var(--color-bloom-500)"
            label={t('selectionProgram.violetCheckbox')}
          />
          <GoalCheckbox
            checked={varin}
            onChange={setVarin}
            accent="var(--color-leaf-500)"
            label={t('selectionProgram.varinCheckbox')}
          />
        </div>

        <TraitTargetPicker
          label={t('selectionProgram.trait.height.label')}
          lowLabel={t('selectionProgram.trait.height.low')}
          highLabel={t('selectionProgram.trait.height.high')}
          value={height}
          onChange={setHeight}
        />
        <TraitTargetPicker
          label={t('selectionProgram.trait.cold.label')}
          lowLabel={t('selectionProgram.trait.cold.low')}
          highLabel={t('selectionProgram.trait.cold.high')}
          value={coldTolerance}
          onChange={setColdTolerance}
        />
        <TraitTargetPicker
          label={t('selectionProgram.trait.sun.label')}
          lowLabel={t('selectionProgram.trait.sun.low')}
          highLabel={t('selectionProgram.trait.sun.high')}
          value={sunTolerance}
          onChange={setSunTolerance}
        />
        <TraitTargetPicker
          label={t('selectionProgram.trait.mold.label')}
          lowLabel={t('selectionProgram.trait.mold.low')}
          highLabel={t('selectionProgram.trait.mold.high')}
          value={moldResistance}
          onChange={setMoldResistance}
        />

        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
            {t('selectionProgram.terpeneTarget.label')}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setTerpeneTarget(null)}
              className="rounded px-1 py-2 text-[11px] leading-tight transition-colors"
              style={{
                background: terpeneTarget === null ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                color: terpeneTarget === null ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
              }}
            >
              {t('selectionProgram.indifferent')}
            </button>
            {terpeneOrder.map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => setTerpeneTarget(key)}
                className="rounded px-1 py-2 text-[11px] leading-tight transition-colors"
                style={{
                  background: terpeneTarget === key ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                  color: terpeneTarget === key ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
                }}
              >
                {key === 'caryophyllene' ? `${tEnum('terpene', 'caryophyllene')}/${tEnum('terpene', 'humulene')}` : tEnum('terpene', key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <GoalCheckbox
        checked={showMarkerAssisted}
        onChange={setShowMarkerAssisted}
        accent="var(--color-resin-500)"
        label="Estimer l'intérêt d'un tri génétique précoce (sélection assistée par marqueurs)"
      />

      <button
        type="button"
        disabled={!ready || running}
        onClick={run}
        className="w-full rounded py-2.5 text-sm font-medium transition-transform disabled:opacity-40 hover:not-disabled:-translate-y-0.5"
        style={{ background: 'var(--color-leaf-500)', color: 'var(--color-ink-900)' }}
      >
        {running ? t('selectionProgram.runButton.running') : t('selectionProgram.runButton')}
      </button>

      {result && (
        <div className="mt-5">
          <div className="divider-vine my-3" style={{ background: 'var(--color-paper-300)' }} />

          <p className="text-[11px] mb-2 rounded p-2 leading-snug" style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-300)' }}>
            <strong>[F1]</strong> = 1ère génération, issue directement des deux fondateurs. <strong>[fratrie]</strong> = croisement
            entre deux individus de la même portée (frère × sœur), utile pour combiner deux traits récessifs distincts.{' '}
            <strong>[rétrocroisement]</strong> = croisement avec un individu déjà présent dans la lignée (pas forcément un
            fondateur d'origine) qui améliore le score moyen. À chaque génération, les deux stratégies sont testées et
            celle qui obtient le meilleur score moyen sur l'ensemble des critères est retenue.
          </p>

          {result.warnings.map((w, i) => (
            <p
              key={i}
              className="text-xs mb-2 rounded p-2"
              style={{ background: 'var(--color-canopy-800)', color: 'var(--color-bloom-400)' }}
            >
              ⚠ {w}
            </p>
          ))}

          <p className="text-sm mb-2">
            {result.goalReached ? (
              <span style={{ color: 'var(--color-leaf-500)' }}>✔ {t('selectionProgram.result.goalReached', { n: result.steps.length })}</span>
            ) : result.stoppedReason === 'plateau' ? (
              <span style={{ color: 'var(--color-bloom-400)' }}>
                {t('selectionProgram.result.plateau', { n: result.steps.length })}
              </span>
            ) : (
              <span style={{ color: 'var(--color-bloom-400)' }}>
                {t('selectionProgram.result.generationLimit', { n: result.steps.length })}
              </span>
            )}
          </p>

          {previousResult && (() => {
            const prevBest = previousResult.best;
            const curBest = result.best;
            const deltaSteps = result.steps.length - previousResult.steps.length;
            const deltaScore = curBest && prevBest ? (curBest.score - prevBest.score) * 100 : null;
            const fmtDelta = (v: number, unit = '') =>
              `${v > 0 ? '+' : ''}${v.toFixed(v % 1 === 0 ? 0 : 1)}${unit}`;
            return (
              <p className="text-[11px] mb-3 rounded p-2 leading-snug" style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-300)' }}>
                <strong>Vs run précédent :</strong>{' '}
                {previousResult.goalReached ? 'objectif atteint' : previousResult.stoppedReason === 'plateau' ? 'stagnation' : 'limite de générations'}
                {' → '}
                {result.goalReached ? 'objectif atteint' : result.stoppedReason === 'plateau' ? 'stagnation' : 'limite de générations'}
                {' · '}générations {previousResult.steps.length} → {result.steps.length} ({fmtDelta(deltaSteps)})
                {deltaScore !== null && (
                  <>
                    {' · '}meilleur score {(prevBest!.score * 100).toFixed(0)}% → {(curBest!.score * 100).toFixed(0)}% (
                    <span style={{ color: deltaScore >= 0 ? 'var(--color-leaf-500)' : 'var(--color-bloom-400)' }}>{fmtDelta(deltaScore, ' pts')}</span>
                    )
                  </>
                )}
              </p>
            );
          })()}

          {(() => {
            const cycleWeeks = Math.max(founderCycleWeeks(parentA), founderCycleWeeks(parentB));
            const totalWeeks = result.steps.length * cycleWeeks;
            const totalMonths = totalWeeks / 4.345;
            const seedlingsPerGeneration = RECOMMENDED_SEEDS_PER_GENERATION;
            // Semis exploitables visés -> graines à acquérir/planter en
            // tenant compte de l'échec de germination (voir
            // GERMINATION_RATE) : à 10 semis visés et ~85% de
            // germination, planter ~12 graines suffit largement à
            // obtenir au moins un mâle et une femelle exploitables
            // (probabilité de n'obtenir aucun des deux sexes parmi 10
            // semis viables, ratio 50/50 : ~0,2%, négligeable — pas
            // besoin de gonfler encore le chiffre pour ça).
            const seedsToAcquirePerGeneration = Math.ceil(seedlingsPerGeneration / GERMINATION_RATE);
            const totalSeedsToAcquire = result.steps.length * seedsToAcquirePerGeneration;
            return (
              <p className="text-[11px] mb-3 rounded p-2 leading-snug" style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-300)' }}>
                Durée réaliste estimée : <strong>~{totalMonths.toFixed(1)} mois</strong> ({result.steps.length} génération
                {result.steps.length > 1 ? 's' : ''} × ~{cycleWeeks.toFixed(0)} semaines de cycle graine-à-graine)
                {(!parentA?.strainInfo || !parentB?.strainInfo) && ' — cycle par défaut, aucune fiche de culture vérifiée sur ce(s) fondateur(s)'}.
                {' '}Graines à acquérir/planter : <strong>~{totalSeedsToAcquire}</strong> au total (~{seedsToAcquirePerGeneration} par génération, dont
                ~{seedlingsPerGeneration} semis exploitables visés une fois le taux de germination (~{Math.round(GERMINATION_RATE * 100)}%) pris en compte).
                Des graines féminisées ne conviennent pas ici : le programme a besoin d'un mâle ET d'une femelle segrégeant à chaque génération pour
                enchaîner les croisements, ce que des graines féminisées (quasi 100% femelles) ne permettent pas.
              </p>
            );
          })()}

          <div className="flex items-center gap-2 mb-3 text-[11px]" style={{ color: 'var(--color-ink-500)' }}>
            <label htmlFor="program-start-date">Date de départ (semis initial) :</label>
            <input
              id="program-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded px-2 py-1 text-xs outline-none"
              style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
            />
          </div>

          {startDate &&
            (() => {
              const cycleWeeks = Math.max(founderCycleWeeks(parentA), founderCycleWeeks(parentB));
              const totalWeeks = result.steps.length * cycleWeeks;
              const start = new Date(startDate + 'T00:00:00');
              if (Number.isNaN(start.getTime())) return null;
              const end = new Date(start.getTime() + totalWeeks * 7 * 24 * 3600 * 1000);
              const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
              return (
                <p className="text-[11px] mb-3 rounded p-2 leading-snug" style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-300)' }}>
                  📅 En partant du <strong>{fmt(start)}</strong>, la dernière génération du programme serait récoltée vers le{' '}
                  <strong>{fmt(end)}</strong> — estimation basée sur des cycles enchaînés sans délai entre générations (récolte → séchage →
                  semis suivant immédiat), donc plutôt une borne basse : prévois une marge pour le séchage/curing et le temps entre deux cycles.
                </p>
              );
            })()}

          {showMarkerAssisted && (() => {
            const avgPassRate = result.steps.reduce((sum, s) => sum + s.mendelianPassRate, 0) / result.steps.length;
            const avoidedPercent = Math.round((1 - avgPassRate) * 100);
            return (
              <p className="text-[11px] mb-3 rounded p-2 leading-snug" style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-300)' }}>
                <strong>Tri génétique précoce (avant floraison)</strong> : en moyenne ~{Math.round(avgPassRate * 100)}% de chaque portée
                passerait un test génétique sur chimiotype{autoflower || violet || varin ? ' + auto-floraison/violet/varin' : ''}
                (loci mendéliens simples, testables sur de jeunes semis) — les ~{avoidedPercent}% restants pourraient être écartés
                avant floraison plutôt que d'occuper l'espace de culture jusqu'à maturité. Ne change PAS l'élite retenue (basée sur
                le phénotype complet) ni la durée calendaire du programme — seulement l'espace/coût de culture nécessaire à chaque
                génération. Les traits polygéniques (hauteur, froid, lumière, terpènes) n'ont pas d'équivalent testable tôt.
              </p>
            );
          })()}

          <ProgramPedigreeDiagram ref={pedigreeSvgRef} steps={result.steps} bestLabel={result.best?.label} />

          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1 mt-3">
            {result.steps.map((s) => {
              const p = engine.cannabinoidPhenotype(s.individual);
              return (
                <div
                  key={s.step}
                  className="rounded p-2.5 text-xs"
                  style={{
                    background: s.matchesGoal ? 'var(--color-leaf-800, var(--color-canopy-800))' : 'var(--color-canopy-800)',
                    color: 'var(--color-paper-100)',
                  }}
                >
                  <p className="genotype-code">
                    {s.formula} <span className="opacity-60">[{s.pairingKind}]</span>
                  </p>
                  <p className="mt-0.5 opacity-80">
                    {s.individual.sex === 'F' ? '♀' : '♂'} · {CHEMOTYPES[engine.chemotypeOf(s.individual)].label} ·{' '}
                    {p.propylSeries
                      ? p.chemotype === 'IV'
                        ? `CBGV ${p.cbgvPercent}%`
                        : p.chemotype === 'VI'
                          ? `CBCV ${p.cbcvPercent}%`
                          : p.chemotype === 'V'
                            ? t('selectionProgram.step.cannabinoids', { value: p.totalPotencyPercent })
                            : `CBDV ${p.cbdvPercent}% · THCV ${p.thcvPercent}%`
                      : p.chemotype === 'IV'
                        ? `CBG ${p.cbgPercent}%`
                        : p.chemotype === 'VI'
                          ? `CBC ${p.cbcPercent}%`
                          : p.chemotype === 'V'
                            ? t('selectionProgram.step.cannabinoids', { value: p.totalPotencyPercent })
                            : `CBD ${p.cbdPercent}% · THC ${p.thcPercent}%`}
                    {s.individual.autoflower ? ` · ${t('selectionProgram.step.autoflowerAbbr')}` : ''}
                    {engine.isVioletExpressed(s.individual)
                      ? ` · ${t('selectionProgram.step.violetExpressed')}`
                      : engine.isVioletCarrier(s.individual)
                        ? ` · ${t('selectionProgram.step.violetCarrier')}`
                        : ''}
                    {engine.isVarinExpressed(s.individual)
                      ? ` · ${t('selectionProgram.step.varinExpressed')}`
                      : engine.isVarinCarrier(s.individual)
                        ? ` · ${t('selectionProgram.step.varinCarrier')}`
                        : ''}
                    {height ? ` · ${t('selectionProgram.step.height', { value: engine.heightPercent(s.individual).toFixed(0) })}` : ''}
                    {coldTolerance ? ` · ${t('selectionProgram.step.cold', { value: engine.coldTolerancePercent(s.individual).toFixed(0) })}` : ''}
                    {sunTolerance ? ` · ${t('selectionProgram.step.sun', { value: engine.sunTolerancePercent(s.individual).toFixed(0) })}` : ''}
                    {moldResistance ? ` · ${t('selectionProgram.step.mold', { value: engine.moldResistancePercent(s.individual).toFixed(0) })}` : ''}
                    {terpeneTarget ? ` · ${engine.chemovarLabel(s.individual, (key) => tEnum('terpene', key))}` : ''}
                    {' · '}
                    {t('selectionProgram.step.score')}{' '}
                    {(s.score * 100).toFixed(0)}%{s.matchesGoal ? ' ✔' : ''}
                  </p>
                  <p className="mt-0.5 opacity-60">
                    vigueur {engine.vigorPercent(s.individual).toFixed(0)}%
                    {engine.inbreedingPercent(s.individual) > 0 && (
                      <span style={engine.inbreedingPercent(s.individual) >= 25 ? { color: 'var(--color-bloom-400)' } : undefined}>
                        {' '}· consanguinité F≈{engine.inbreedingPercent(s.individual)}%
                      </span>
                    )}
                  </p>
                  {s.scoreDims.length > 1 && (
                    <p className="mt-0.5 opacity-50 text-[10px]">
                      détail :{' '}
                      {s.scoreDims.map((d, i) => (
                        <span key={d.key} style={d.score < 0.5 ? { color: 'var(--color-bloom-400)' } : undefined}>
                          {d.label} {(d.score * 100).toFixed(0)}%{i < s.scoreDims.length - 1 ? ' · ' : ''}
                        </span>
                      ))}
                    </p>
                  )}
                  {s.siblingPartnerLabel && (
                    <p className="mt-0.5 opacity-60">
                      ↳ {s.siblingPartnerLabel} : autre individu de cette même portée, retenu comme partenaire pour l'étape suivante
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={exportTxt}
              className="flex-1 rounded py-2 text-xs font-medium transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--color-paper-300)', color: 'var(--color-ink-900)' }}
            >
              {t('selectionProgram.export.txt')}
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="flex-1 rounded py-2 text-xs font-medium transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--color-paper-300)', color: 'var(--color-ink-900)' }}
            >
              {t('selectionProgram.export.json')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (pedigreeSvgRef.current) {
                  exportPedigreePng(pedigreeSvgRef.current, 'lignee-arbre-genealogique.png');
                }
              }}
              className="flex-1 rounded py-2 text-xs font-medium transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--color-paper-300)', color: 'var(--color-ink-900)' }}
            >
              {t('selectionProgram.export.png')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Sélecteur à 4 positions (indifférent / faible / moyen / élevé) pour
 * un trait polygénique continu — les libellés bas/haut sont fournis
 * par l'appelant pour rester parlants (« compacte »/« haute »,
 * « tolère l'ombre »/« plein soleil »...). */
function TraitTargetPicker({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  label: string;
  lowLabel: string;
  highLabel: string;
  value: TraitTarget;
  onChange: (v: TraitTarget) => void;
}) {
  const { t } = useTranslation();
  const options: Array<{ id: TraitTarget; text: string }> = [
    { id: null, text: t('selectionProgram.trait.option.indifferent') },
    { id: 'faible', text: lowLabel },
    { id: 'moyen', text: t('selectionProgram.trait.option.medium') },
    { id: 'élevé', text: highLabel },
  ];
  return (
    <div>
      <p className="text-xs mb-1.5" style={{ color: 'var(--color-ink-500)' }}>
        {label}
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {options.map((opt) => (
          <button
            type="button"
            key={opt.text}
            onClick={() => onChange(opt.id)}
            className="rounded px-1 py-2 text-[11px] leading-tight transition-colors break-words hyphens-auto"
            style={{
              background: value === opt.id ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
              color: value === opt.id ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
            }}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function ParentSlot({ individual, engine }: { individual: Individual | null; engine: BreedingEngine }) {
  const { t } = useTranslation();
  if (!individual) {
    return (
      <div
        className="rounded border border-dashed px-3 py-3 text-center text-xs"
        style={{ borderColor: 'var(--color-ink-500)', color: 'var(--color-ink-500)' }}
      >
        {t('selectionProgram.chooseSpecimen')}
      </div>
    );
  }
  return (
    <div className="rounded px-3 py-2" style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-900)' }}>
      <p className="text-sm font-medium truncate">{individual.label || individual.id}</p>
      <p className="genotype-code text-xs opacity-70">
        {individual.sex === 'F' ? t('selectionProgram.parentSlot.female') : t('selectionProgram.parentSlot.male')} ·{' '}
        {engine.genotypeCode(individual)}
      </p>
    </div>
  );
}

function GoalCheckbox({
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
    <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none" style={{ color: 'var(--color-ink-700)' }}>
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
