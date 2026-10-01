import { useLanguage, type Language } from '../i18n/LanguageContext';

const FLAGS: Array<{ lang: Language; flag: string; label: string }> = [
  { lang: 'fr', flag: '🇫🇷', label: 'Français' },
  { lang: 'en', flag: '🇬🇧', label: 'English' },
];

/** Sélecteur de langue en deux drapeaux, toujours visible dans l'en-tête. */
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Français / English">
      {FLAGS.map(({ lang, flag, label }) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          title={label}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none transition-transform hover:-translate-y-0.5"
          style={{
            background: language === lang ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
            boxShadow: language === lang ? 'none' : 'inset 0 0 0 1px var(--color-canopy-600)',
          }}
        >
          <span aria-hidden="true">{flag}</span>
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
