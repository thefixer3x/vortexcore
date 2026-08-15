import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import LogRocket from "logrocket";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { TwoFactorVerification } from "./TwoFactorVerification";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupFormProps {
  /** Optional redirect path to return to after signup */
  redirectTo?: string;
}

export function SignupForm({ redirectTo }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const { identifyUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      LogRocket.track("signup_attempt", { method: "email", name: name || "unnamed" });

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split("@")[0],
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        LogRocket.track("signup_failed", {
          method: "email",
          reason: error.message,
        });
        toast({
          title: "Signup Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // If a session was created (email confirm disabled or user already exists), sign them in
      // If no session, email confirmation is required — redirect to a confirmation screen
      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Check if user was created (email confirmation may be required)
      // On success, Supabase handles the redirect to /auth/callback for OAuth
      // For email/password, redirect to dashboard (email not required for this project)
      toast({
        title: "Account Created",
        description: "Welcome to VortexCore! Setting up your account...",
      });

      LogRocket.track("signup_successful", { method: "email" });

      // For email/password signup, the user is now signed in via the handle_new_user edge
      // function that creates a profile and wallet. Navigate to dashboard.
      // If email confirmation IS required, this will navigate to auth/callback which will
      // show an error briefly, but Supabase's default flow handles re-login after confirmation.
      navigate(redirectTo || "/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      LogRocket.track("signup_failed", {
        method: "email",
        error: err instanceof Error ? err.message : "unknown",
      });
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred during signup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showTwoFactor) {
    return <TwoFactorVerification email={email} onCancel={() => setShowTwoFactor(false)} />;
  }

  return (
    <div className="w-full max-w-md space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">
          Start managing your finances with VortexCore
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Alex Volkov"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              At least 6 characters
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="h-11"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={() => setRememberMe(!rememberMe)}
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </label>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            type="submit"
            className="w-full relative overflow-hidden"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign up"}
            {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTwoFactor(true)}
            className="flex-none"
            title="Enable 2FA"
          >
            <ShieldCheck className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <SocialLoginButtons />

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Button
          variant="link"
          className="p-0 h-auto font-normal"
          onClick={() => navigate("/")}
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}