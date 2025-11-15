// Auth configuration utilities
export const getRedirectUrl = (path: string = '/dashboard') => {
  const currentOrigin = window.location.origin;
  
  // If running locally, use production URL for magic links
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    // Try to detect deployment URLs from environment or use fallback
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    const netlifyUrl = import.meta.env.VITE_NETLIFY_URL;
    
    // Priority: Vercel > Netlify > hardcoded fallback
    if (vercelUrl) {
      return `https://${vercelUrl}${path}`;
    } else if (netlifyUrl) {
      return `https://${netlifyUrl}${path}`;
    } else {
      // Fallback - you'll need to update this with your actual deployment URL
      return `https://vortexcore-testing.vercel.app${path}`;
    }
  }
  
  // Use current origin for production deployments
  return `${currentOrigin}${path}`;
};

export const getAuthCallbackUrl = () => {
  // For OAuth, always use the central auth system with project routing
  return 'https://api.lanonasis.com/auth/callback?return_to=vortexcore';
};

export const getOAuthRedirectUrl = (provider: string) => {
  // All OAuth providers redirect through central system
  return `https://api.lanonasis.com/auth/callback?return_to=vortexcore&provider=${provider}`;
};
