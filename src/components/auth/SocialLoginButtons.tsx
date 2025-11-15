
import { Button } from "@/components/ui/button";
import { useAuthProviders } from "@/hooks/use-auth-providers";
import { Twitter, Instagram, Linkedin, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export function SocialLoginButtons() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { 
    signInWithGoogle, 
    signInWithInstagram, 
    signInWithTwitter, 
    signInWithLinkedIn 
  } = useAuthProviders();
  
  const handleSocialLogin = async (
    provider: string, 
    signInFunction: () => Promise<{data: any, error: any}>
  ) => {
    try {
      setIsLoading(provider);
      const { error } = await signInFunction();
      
      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message || `Failed to sign in with ${provider}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred during social login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(null);
    }
  };
  
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <Button
        variant="outline"
        type="button"
        disabled={isLoading !== null}
        onClick={() => handleSocialLogin('google', signInWithGoogle)}
        className="flex items-center justify-center gap-2"
      >
        {isLoading === 'google' ? (
          <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        <span>Google</span>
      </Button>
      
      <Button
        variant="outline"
        type="button"
        disabled={isLoading !== null}
        onClick={() => handleSocialLogin('twitter', signInWithTwitter)}
        className="flex items-center justify-center gap-2"
      >
        {isLoading === 'twitter' ? (
          <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
        ) : (
          <Twitter className="h-4 w-4" />
        )}
        <span>X (Twitter)</span>
      </Button>
      
      <Button
        variant="outline"
        type="button"
        disabled={isLoading !== null}
        onClick={() => handleSocialLogin('linkedin', signInWithLinkedIn)}
        className="flex items-center justify-center gap-2"
      >
        {isLoading === 'linkedin' ? (
          <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
        ) : (
          <Linkedin className="h-4 w-4" />
        )}
        <span>LinkedIn</span>
      </Button>
      
      <Button
        variant="outline"
        type="button"
        disabled={isLoading !== null}
        onClick={() => handleSocialLogin('instagram', signInWithInstagram)}
        className="flex items-center justify-center gap-2"
      >
        {isLoading === 'instagram' ? (
          <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
        ) : (
          <Instagram className="h-4 w-4" />
        )}
        <span>Instagram</span>
      </Button>
    </div>
  );
}
