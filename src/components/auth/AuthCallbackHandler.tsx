
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function AuthCallbackHandler() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth callback error:", error);
        setError(error.message);
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to complete authentication",
          variant: "destructive"
        });
        setTimeout(() => navigate("/"), 3000);
        return;
      }
      
      if (data.session) {
        toast({
          title: "Authentication Successful",
          description: "You have successfully signed in"
        });
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    };
    
    handleAuthCallback();
  }, [navigate]);
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold">Authentication Failed</h1>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Redirecting you back to the home page...
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Completing Authentication</h1>
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-r-transparent animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">
              Please wait while we complete the authentication process...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
