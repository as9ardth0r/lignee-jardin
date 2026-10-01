import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.tsx'
import { LanguageProvider } from './i18n/LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <Root />
    </LanguageProvider>
  </StrictMode>,
)

// Masque le splash natif (Capacitor Android) une fois le premier rendu
// React réellement peint à l'écran — plus fiable qu'une durée fixe
// (`launchShowDuration`) sur un téléphone lent, et évite le flash de
// page blanche entre la disparition du splash et l'arrivée du contenu.
// Double requestAnimationFrame : le premier est planifié avant le
// paint du rendu qu'on vient de déclencher, le second s'exécute après.
// No-op silencieux sur le web (import dynamique + no-op si le plugin
// natif n'est pas là, voir le guard `isNativePlatform`).
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    // Masque le splash HTML d'amorçage (voir index.html) en fondu, une
    // fois le premier rendu React réellement peint à l'écran.
    const bootSplash = document.getElementById('boot-splash')
    if (bootSplash) {
      bootSplash.classList.add('boot-splash-hide')
      setTimeout(() => bootSplash.remove(), 400)
    }

    import('@capacitor/core')
      .then(({ Capacitor }) => {
        if (!Capacitor.isNativePlatform()) return
        import('@capacitor/splash-screen').then(({ SplashScreen }) => SplashScreen.hide()).catch(() => {})
      })
      .catch(() => {})
  })
})
