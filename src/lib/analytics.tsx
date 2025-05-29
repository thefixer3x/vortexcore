import { useEffect } from 'react';
import LogRocket from 'logrocket';

// Wrapper component to add LogRocket user identification after login
export function LogRocketUserIdentifier({ userId, userEmail, userName, extraData = {} }) {
  useEffect(() => {
    if (userId) {
      // Identify the user in LogRocket
      LogRocket.identify(userId, {
        name: userName || 'Unknown User',
        email: userEmail || '',
        ...extraData
      });
    }
  }, [userId, userEmail, userName, extraData]);

  // This is a utility component that doesn't render anything
  return null;
}

// Track custom events throughout the app
export function trackEvent(eventName, properties = {}) {
  LogRocket.track(eventName, {
    timestamp: new Date().toISOString(),
    ...properties
  });
}

// Track form submissions
export function trackFormSubmission(formName, status, details = {}) {
  LogRocket.track('form_submission', {
    form: formName,
    status: status, // 'success', 'error', 'validation_failed'
    ...details
  });
}

// Track user actions
export function trackUserAction(action, target, details = {}) {
  LogRocket.track('user_action', {
    action: action, // 'click', 'hover', 'scroll', etc.
    target: target, // element or feature name
    ...details
  });
}

// Track app performance
export function trackPerformance(metricName, value, details = {}) {
  LogRocket.track('performance', {
    metric: metricName,
    value: value,
    ...details
  });
}

// Create a hook for tracking component renders and lifecycle
export function useTrackComponentLifecycle(componentName) {
  useEffect(() => {
    const startTime = performance.now();
    
    LogRocket.track('component_mount', {
      component: componentName,
      timestamp: new Date().toISOString()
    });
    
    return () => {
      const duration = performance.now() - startTime;
      
      LogRocket.track('component_unmount', {
        component: componentName,
        duration: duration,
        timestamp: new Date().toISOString()
      });
    };
  }, [componentName]);
}

// Custom hook for tracking feature usage
export function useFeatureTracking(featureName) {
  const trackFeatureUsage = (action, details = {}) => {
    LogRocket.track('feature_usage', {
      feature: featureName,
      action: action,
      timestamp: new Date().toISOString(),
      ...details
    });
  };
  
  return trackFeatureUsage;
}
