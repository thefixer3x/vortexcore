/**
 * Configuration validator utility for VortexCore
 * Helps identify missing environment variables and configuration issues
 */

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export function validateClientConfig(): ConfigValidationResult {
  const result: ConfigValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: []
  };

  // Check required Supabase configuration
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    result.isValid = false;
    result.errors.push('VITE_SUPABASE_URL is missing from environment variables');
    result.recommendations.push('Set VITE_SUPABASE_URL to your Supabase project URL (e.g., https://your-project-id.supabase.co)');
  } else if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    result.warnings.push('VITE_SUPABASE_URL may have incorrect format');
    result.recommendations.push('Verify VITE_SUPABASE_URL format: https://your-project-id.supabase.co');
  }

  if (!supabaseAnonKey) {
    result.isValid = false;
    result.errors.push('VITE_SUPABASE_ANON_KEY is missing from environment variables');
    result.recommendations.push('Set VITE_SUPABASE_ANON_KEY to your Supabase anonymous/public key');
  } else if (!supabaseAnonKey.startsWith('eyJ')) {
    result.warnings.push('VITE_SUPABASE_ANON_KEY may have incorrect format (should be a JWT token)');
  }

  // Check optional but recommended configuration
  const logRocketAppId = import.meta.env.VITE_LOGROCKET_APP_ID;
  if (!logRocketAppId) {
    result.warnings.push('VITE_LOGROCKET_APP_ID is not set - analytics will be limited');
    result.recommendations.push('Consider setting up LogRocket for better user analytics');
  }

  return result;
}

export function generateConfigHelp(): string {
  const validation = validateClientConfig();
  
  let help = '🔧 VortexCore Configuration Status\n\n';
  
  if (validation.isValid) {
    help += '✅ Configuration appears valid!\n\n';
  } else {
    help += '❌ Configuration issues found:\n\n';
  }

  if (validation.errors.length > 0) {
    help += '🚨 ERRORS (must fix):\n';
    validation.errors.forEach(error => {
      help += `  • ${error}\n`;
    });
    help += '\n';
  }

  if (validation.warnings.length > 0) {
    help += '⚠️  WARNINGS:\n';
    validation.warnings.forEach(warning => {
      help += `  • ${warning}\n`;
    });
    help += '\n';
  }

  if (validation.recommendations.length > 0) {
    help += '💡 RECOMMENDATIONS:\n';
    validation.recommendations.forEach(rec => {
      help += `  • ${rec}\n`;
    });
    help += '\n';
  }

  help += '📚 Setup Guide:\n';
  help += '  1. Copy .env.example to .env\n';
  help += '  2. Get Supabase credentials from: https://supabase.com/dashboard/project/_/settings/api\n';
  help += '  3. Update .env with your actual values\n';
  help += '  4. Restart your development server\n';

  return help;
}

// Development helper - log configuration status
export function logConfigStatus(): void {
  if (import.meta.env.DEV) {
    console.group('🔧 VortexCore Configuration Check');
    const validation = validateClientConfig();
    
    if (validation.isValid) {
      console.log('✅ Configuration valid');
    } else {
      console.error('❌ Configuration issues found:');
      validation.errors.forEach(error => console.error(`  • ${error}`));
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      validation.warnings.forEach(warning => console.warn(`  • ${warning}`));
    }
    
    console.groupEnd();
  }
}