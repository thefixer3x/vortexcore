import LogRocket from 'logrocket';
import { useEffect, useRef } from 'react';

/**
 * Utility hook to track time spent on a page or component
 * @param pageName Name of the page or component to track
 */
export function usePageViewDuration(pageName: string) {
  const startTimeRef = useRef<number>(performance.now());
  
  useEffect(() => {
    // Log page view start
    LogRocket.track('page_view_start', {
      page: pageName,
      timestamp: new Date().toISOString()
    });
    
    return () => {
      const duration = performance.now() - startTimeRef.current;
      
      // Log page view end and duration
      LogRocket.track('page_view_end', {
        page: pageName,
        duration: Math.round(duration),
        durationSeconds: Math.round(duration / 1000),
        timestamp: new Date().toISOString()
      });
    };
  }, [pageName]);
}

/**
 * Track user interactions with a specific element
 * @param elementName Name of the element to track
 * @param interactionType Type of interaction to track (click, hover, etc.)
 * @param ref React ref to the element
 * @param extraData Additional data to include in the event
 */
export function useElementInteractionTracking(
  elementName: string,
  interactionType: 'click' | 'hover' | 'focus' | 'blur',
  ref: React.RefObject<HTMLElement>,
  extraData: Record<string, any> = {}
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleInteraction = () => {
      LogRocket.track('element_interaction', {
        element: elementName,
        interaction: interactionType,
        timestamp: new Date().toISOString(),
        ...extraData
      });
    };
    
    // Attach the appropriate event listener based on interaction type
    switch (interactionType) {
      case 'click':
        element.addEventListener('click', handleInteraction);
        break;
      case 'hover':
        element.addEventListener('mouseenter', handleInteraction);
        break;
      case 'focus':
        element.addEventListener('focus', handleInteraction);
        break;
      case 'blur':
        element.addEventListener('blur', handleInteraction);
        break;
    }
    
    // Clean up event listener
    return () => {
      switch (interactionType) {
        case 'click':
          element.removeEventListener('click', handleInteraction);
          break;
        case 'hover':
          element.removeEventListener('mouseenter', handleInteraction);
          break;
        case 'focus':
          element.removeEventListener('focus', handleInteraction);
          break;
        case 'blur':
          element.removeEventListener('blur', handleInteraction);
          break;
      }
    };
  }, [elementName, interactionType, ref, extraData]);
}

/**
 * Track form interaction and submission
 * @param formName Name of the form to track
 * @param shouldTrackFields Whether to track individual field interactions
 */
export function useFormTracking(formName: string, shouldTrackFields: boolean = false) {
  // Track form submission
  const trackSubmission = (status: 'success' | 'error' | 'validation_failed', details: Record<string, any> = {}) => {
    LogRocket.track('form_submission', {
      form: formName,
      status: status,
      timestamp: new Date().toISOString(),
      ...details
    });
  };
  
  // Track form field interaction
  const trackFieldInteraction = (fieldName: string, interactionType: 'focus' | 'blur' | 'change', details: Record<string, any> = {}) => {
    if (!shouldTrackFields) return;
    
    LogRocket.track('form_field_interaction', {
      form: formName,
      field: fieldName,
      interaction: interactionType,
      timestamp: new Date().toISOString(),
      ...details
    });
  };
  
  return {
    trackSubmission,
    trackFieldInteraction
  };
}
