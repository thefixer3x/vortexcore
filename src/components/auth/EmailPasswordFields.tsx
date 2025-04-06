
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface EmailPasswordFieldsProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
}

export function EmailPasswordFields({ 
  email, 
  setEmail, 
  password, 
  setPassword 
}: EmailPasswordFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const toggleShowPassword = () => setShowPassword(!showPassword);
  
  return (
    <>
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
    </>
  );
}
