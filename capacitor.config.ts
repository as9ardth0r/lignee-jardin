import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lignee.jardin',
  appName: 'Lignée Jardin',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_notify',
      iconColor: '#4a7f36',
    },
    // Le splash natif reste affiché tant que main.tsx n'appelle pas
    // SplashScreen.hide() explicitement (voir main.tsx) — évite le
    // flash de contenu non stylé pendant le chargement du bundle JS,
    // plus fiable qu'une durée fixe (launchShowDuration) sur un
    // téléphone lent.
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#152218',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
