import { Button } from "@/components/ui/button";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { BiometricAuthButton } from "./BiometricAuthButton";
import { Link } from "react-router-dom";

interface LoginFormFooterProps {
  isLoading: boolean;
}

export function LoginFormFooter({ isLoading }: LoginFormFooterProps) {
  void isLoading;
  return (
    <div className="flex flex-col space-y-4">
      <SocialLoginButtons />
      
      <BiometricAuthButton />
      
      <div className="text-center text-sm text-muted-foreground mt-4">
        Don't have an account?{" "}
        <Button variant="link" className="p-0 h-auto font-normal" asChild>
          <Link to="/auth">Create account</Link>
        </Button>
      </div>
    </div>
  );
}
