import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useLanguage as useHostLanguage } from '../../../i18n/LanguageContext';
import { translations, type Language, type TranslationKey } from './translations';

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Traduit `key` dans la langue courante, avec interpolation `{{var}}` optionnelle. */
  t: (key: TranslationKey, vars?: Vars) => string;
  /**
   * Pluralisation simple à deux formes (singulier/pluriel), en s'appuyant
   * sur des clés `<base>_one` / `<base>_other`. Le compte `n` est
   * automatiquement injecté comme variable `n` dans le template.
   */
  tPlural: (base: string, n: number, vars?: Vars) => string;
  /** Traduit une valeur d'enum fermée de la bibliothèque de variétés
   * (préférence de température, difficulté, environnement) ou une clé
   * de terpène (`TerpeneKey` du moteur, ex. "myrcene") — jamais le
   * texte libre des fiches (nom, description, origine, climat...). */
  tEnum: (category: 'tempPreference' | 'difficulty' | 'environment' | 'terpene', value: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Atelier intégré à Lignée Jardin : la langue est celle de l'app hôte.
  const { language, setLanguage } = useHostLanguage();

  const t = useCallback<LanguageContextValue['t']>(
    (key, vars) => {
      const dict = translations[language];
      const template = (dict as Record<string, string>)[key] ?? (translations.fr as Record<string, string>)[key] ?? key;
      return interpolate(template, vars);
    },
    [language]
  );

  const tPlural = useCallback<LanguageContextValue['tPlural']>(
    (base, n, vars) => {
      const key = (n === 1 ? `${base}_one` : `${base}_other`) as TranslationKey;
      return t(key, { n, ...vars });
    },
    [t]
  );

  const tEnum = useCallback<LanguageContextValue['tEnum']>(
    (category, value) => {
      const key = `enum.${category}.${value}` as TranslationKey;
      const dict = translations[language] as Record<string, string>;
      return dict[key] ?? value;
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t, tPlural, tEnum }),
    [language, setLanguage, t, tPlural, tEnum]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation doit être utilisé sous LanguageProvider');
  return ctx;
}
