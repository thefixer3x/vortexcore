import LogRocket from 'logrocket';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router integration for LogRocket
 * Tracks page views and navigation events
 */
export function LogRocketRouterTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    LogRocket.track('page_view', {
      path: location.pathname,
      search: location.search,
      hash: location.hash,
      title: document.title
    });
  }, [location]);

  // No UI - this is just a tracker component
  return null;
}
