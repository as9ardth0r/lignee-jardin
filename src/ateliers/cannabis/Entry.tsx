import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';

/** L'atelier cannabis garde son propre système de traduction, branché sur la langue de l'hôte. */
export default function CannabisAtelier() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
