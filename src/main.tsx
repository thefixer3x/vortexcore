import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, ReactQueryProvider } from 'react-query'
import { PaymentStatusProvider } from './PaymentStatusProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      // Payment-specific caching
      paymentStatus: {
        refetchInterval: 1000 * 30
      }
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <ReactQueryProvider client={queryClient}>
    <PaymentStatusProvider>
      <App />
    </PaymentStatusProvider>
  </ReactQueryProvider>
);
