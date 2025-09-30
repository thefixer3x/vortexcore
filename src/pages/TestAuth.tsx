import { useState } from 'react';
import { useAuthFix } from '@/hooks/use-auth-fix';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getRedirectUrl } from '@/utils/auth-config';

export default function TestAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  const { signUp, signIn, signOut } = useAuthFix();

  // Check current user on load
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    
    return () => subscription.unsubscribe();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isSignUp) {
      await signUp(email, password, fullName);
    } else {
      await signIn(email, password);
    }
    
    setLoading(false);
    
    // Refresh user state
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getRedirectUrl('/dashboard'),
        },
      });
      
      if (error) throw error;
      
      setMagicLinkSent(true);
    } catch (error: any) {
      console.error('Magic link error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardHeader>
            <CardTitle>Auth Testing Page</CardTitle>
            <CardDescription>
              Test authentication functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ Logged in as: {user.email}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    User ID: {user.id}
                  </p>
                </div>
                
                <Button 
                  onClick={handleSignOut}
                  className="w-full"
                  variant="destructive"
                >
                  Sign Out
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : magicLinkSent ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    📧 Magic link sent to {email}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Check your email and click the link to sign in
                  </p>
                </div>
                
                <Button 
                  onClick={() => setMagicLinkSent(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                )}
                
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </Button>
                </form>
                
                <div className="mt-4">
                  <Button
                    onClick={handleMagicLink}
                    variant="outline"
                    className="w-full"
                    disabled={loading || !email}
                  >
                    🪄 Send Magic Link (No Password)
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 Test Credentials:
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Email: test@example.com<br />
            Password: test123456
          </p>
        </div>
      </div>
    </div>
  );
}
