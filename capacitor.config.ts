
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.vortexcore.app',
  appName: 'vortex-core-app',
  webDir: 'dist',
  server: {
    url: 'https://vortexcore.app',
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
      defaultCurrency: 'USD'
    }
  }
};

export default config;
