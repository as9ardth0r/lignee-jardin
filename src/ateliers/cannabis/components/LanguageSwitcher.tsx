import { useTranslation } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';

const FLAGS: Array<{ lang: Language; flag: string; labelKey: 'languageSwitcher.french' | 'languageSwitcher.english' }> = [
  { lang: 'fr', flag: '🇫🇷', labelKey: 'languageSwitcher.french' },
  { lang: 'en', flag: '🇬🇧', labelKey: 'languageSwitcher.english' },
];

/**
 * Sélecteur de langue en deux drapeaux cliquables — pas de menu déroulant,
 * le choix (FR/EN) reste visible en permanence dans l'en-tête.
 */
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Français / English">
      {FLAGS.map(({ lang, flag, labelKey }) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          title={t(labelKey)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none transition-transform hover:-translate-y-0.5"
          style={{
            background: language === lang ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
            boxShadow: language === lang ? 'none' : 'inset 0 0 0 1px var(--color-canopy-600)',
          }}
        >
          <span aria-hidden="true">{flag}</span>
          <span className="sr-only">{t(labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
