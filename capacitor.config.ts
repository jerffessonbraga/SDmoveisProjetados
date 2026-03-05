import type { CapacitorConfig } from '@capacitor/cli';

const isLiveReload = process.env.CAP_LIVE_RELOAD === 'true';

const config: CapacitorConfig = {
  appId: 'app.lovable.6022537e682148b5a0683f599516f310',
  appName: 'SD Móveis Projetados',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    overrideUserAgent: 'SD Moveis App Android',
  },
};

if (isLiveReload) {
  config.server = {
    url: process.env.CAP_SERVER_URL || 'https://6022537e-6821-48b5-a068-3f599516f310.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  };
}

export default config;
