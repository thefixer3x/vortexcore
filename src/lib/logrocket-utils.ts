import LogRocket from 'logrocket';

// This middleware logs errors to LogRocket
export const logRocketErrorMiddleware = () => (next: any) => (action: any) => {
  // Try to execute the next action
  try {
    return next(action);
  } catch (error) {
    // Log any error that occurs
    console.error('Caught error in Redux middleware:', error);
    LogRocket.captureException(error, {
      extra: {
        action: action.type,
        payload: action.payload
      }
    });
    
    // Re-throw the error to not swallow it
    throw error;
  }
};

// Error boundary helper for React components
export const setupLogRocketErrorTracking = () => {
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    LogRocket.captureException(event.reason, {
      extra: {
        type: 'unhandled_promise_rejection'
      }
    });
  });

  // Track JS errors
  window.addEventListener('error', (event) => {
    LogRocket.captureException(event.error, {
      extra: {
        type: 'uncaught_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });
  
  // Track console errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Capture console errors in LogRocket
    if (args[0] && typeof args[0] === 'string') {
      LogRocket.captureMessage(`Console Error: ${args[0]}`, {
        extra: {
          arguments: JSON.stringify(args.slice(1))
        }
      });
    } else if (args[0] instanceof Error) {
      LogRocket.captureException(args[0]);
    }
    
    // Call the original console.error
    originalConsoleError.apply(console, args);
  };
};

// Custom network request/response tracking
export const setupNetworkTracking = () => {
  // LogRocket already captures fetch and XHR automatically,
  // but you can add custom data or filtering if needed
  
  // Example: Add custom tags to specific API calls
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    
    // Tag important API calls
    if (typeof input === 'string' && input.includes('/api/payments')) {
      LogRocket.track('payment_api_called', {
        url: input,
        method: init?.method || 'GET'
      });
    }
    
    return response;
  };
};

// Performance monitoring enhancements
export const setupPerformanceTracking = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          LogRocket.track('largest_contentful_paint', {
            value: entry.startTime,
            element: entry.element ? entry.element.tagName : 'unknown'
          });
        }
        
        if (entry.entryType === 'first-input') {
          LogRocket.track('first_input_delay', {
            value: entry.processingStart - entry.startTime
          });
        }
      });
    });
    
    // Observe LCP and FID
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    observer.observe({ type: 'first-input', buffered: true });
  }
};
