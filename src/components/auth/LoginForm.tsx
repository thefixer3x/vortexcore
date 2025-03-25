
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Fingerprint, Mail, Lock, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1500);
  };
  
  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="w-full max-w-md space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-medium tracking-tight">
          Welcome to VortexCore
        </h2>
        <p className="text-muted-foreground mt-2">
          Sign in to manage your financial ecosystem
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Button
              variant="link"
              className="text-xs p-0 h-auto font-normal"
              type="button"
            >
              Forgot password?
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 right-0 flex items-center"
              onClick={toggleShowPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
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
        
        <Button
          type="submit"
          className="w-full relative overflow-hidden"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
            </span>
          )}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      
      <div className="flex flex-col space-y-2">
        <Button 
          variant="outline" 
          type="button"
          className="flex items-center justify-center gap-2"
        >
          <Fingerprint className="h-4 w-4" />
          <span>Continue with Biometrics</span>
        </Button>
        
        <div className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <Button variant="link" className="p-0 h-auto font-normal">
            Create account
          </Button>
        </div>
      </div>
    </div>
  );
}
