
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8c01f5d59c844d3dabb12e89b11166e0',
  appName: 'vortex-core-app',
  webDir: 'dist',
  server: {
    url: 'https://8c01f5d5-9c84-4d3d-abb1-2e89b11166e0.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    scheme: 'VortexCoreApp',
    contentInset: 'always',
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
    suppressesIncrementalRendering: true,
    allowsBackForwardNavigationGestures: true,
    // Necessary for App Store compliance
    limitsNavigationsToAppBoundDomains: true
  },
  // Add default currency configuration
  plugins: {
    LocalNotifications: {
      defaultCurrency: 'NGN'
    }
  }
};

export default config;
