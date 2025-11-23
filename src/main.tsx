
/**
 * Vortex Core App - Main Entry Point
 * Version: 1.0.0
 * Last updated: 2023-06-30
 */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaymentStatusProvider } from './providers/PaymentStatusProvider'
// import LogRocket from 'logrocket'
// import { setupLogRocketErrorTracking, setupNetworkTracking, setupPerformanceTracking } from './lib/logrocket-utils'
import { AuthProvider } from './contexts/AuthContext'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { logConfigStatus } from './utils/configValidator'

// Log configuration status in development
logConfigStatus();

// Initialize LogRocket for application monitoring
if (import.meta.env.DEV) {
  console.log('Skipping LogRocket for debugging...');
}
// try {
//   LogRocket.init('p1tmu1/vortexcore-app');
//   console.log('LogRocket initialized successfully');
// } catch (error) {
//   console.error('LogRocket initialization failed:', error);
// }

// Setup enhanced LogRocket tracking features
// try {
//   setupLogRocketErrorTracking();
//   setupNetworkTracking();
//   setupPerformanceTracking();
//   console.log('LogRocket tracking features setup complete');
// } catch (error) {
//   console.error('LogRocket tracking setup failed:', error);
// }

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    }
  }
});

if (import.meta.env.DEV) {
  console.log('About to render React app...');
}
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <PaymentStatusProvider>
          <App />
        </PaymentStatusProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);
if (import.meta.env.DEV) {
  console.log('React app render called');
}
