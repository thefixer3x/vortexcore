import LogRocket from 'logrocket';

export const setupLogRocketErrorTracking = () => {
  try {
    LogRocket.track('js.error', {
      name: 'JavaScript Error',
      message: 'An unhandled JavaScript error occurred',
    });
  } catch (error) {
    console.error('LogRocket error tracking setup failed:', error);
  }
};

export const setupNetworkTracking = () => {
  try {
    if ('fetch' in window) {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = args[0];
        const options = args[1] || {};
        const method = options.method || 'GET';
        const startTime = Date.now();

        try {
          const response = await originalFetch(...args);
          const endTime = Date.now();
          const duration = endTime - startTime;

          LogRocket.track('network.request', {
            url,
            method,
            status: response.status,
            duration,
          });

          return response;
        } catch (error) {
          const endTime = Date.now();
          const duration = endTime - startTime;

          LogRocket.track('network.error', {
            url,
            method,
            error: error.message,
            duration,
          });

          throw error;
        }
      };
    }
  } catch (error) {
    console.error('Network tracking setup failed:', error);
  }
};

export const setupPerformanceTracking = () => {
  try {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          LogRocket.track('performance_metric', {
            name: entry.name,
            value: entry.duration || entry.value,
            type: entry.entryType,
            startTime: entry.startTime,
          });
        });
      });

      // Observe various performance metrics
      try {
        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (e) {
        console.warn('Some performance metrics not supported:', e);
      }
    }
  } catch (error) {
    console.error('Performance tracking setup failed:', error);
  }
};
