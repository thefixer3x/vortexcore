
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, ShieldCheck, AlertTriangle } from "lucide-react";

interface SecuritySheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SecuritySheet = ({ open, onClose, onSave }: SecuritySheetProps) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState<"off" | "setup" | "verify" | "enabled">("off");
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load 2FA status from Supabase when sheet opens
  useEffect(() => {
    if (!open || !isAuthenticated || !user?.id) return;

    const fetch2faStatus = async () => {
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("two_factor_enabled")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching 2FA status:", error);
          return;
        }

        if (data?.two_factor_enabled) {
          setTwoFactorEnabled(true);
          setTwoFactorStatus("enabled");
        }
      } catch (error) {
        console.error("Error loading 2FA status:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetch2faStatus();
  }, [open, isAuthenticated, user?.id]);

  const handleToggle2FA = async () => {
    if (!isAuthenticated || !user?.email) return;

    setIsLoading(true);
    try {
      // Call the auth edge function to set up 2FA
      const { data, error } = await supabase.functions.invoke("auth", {
        body: { action: "setup-2fa", email: user.email },
      });

      if (error) throw new Error(error);

      // Store factorId for verification step
      if (data?.factorId) {
        setPendingFactorId(data.factorId);
        setTwoFactorStatus("verify");
        toast({
          title: "Verify 2FA",
          description: "Check your email for the verification code and enter it below.",
        });
      } else {
        setTwoFactorEnabled(true);
        setTwoFactorStatus("enabled");
        toast({
          title: "2FA enabled",
          description: "Two-factor authentication has been enabled successfully.",
        });
      }
    } catch (error) {
      console.error("2FA setup error:", error);
      toast({
        title: "2FA Setup Error",
        description: error instanceof Error ? error.message : "Failed to set up two-factor authentication.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!pendingFactorId || !verificationCode) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auth", {
        body: { action: "verify-2fa", factorId: pendingFactorId, code: verificationCode },
      });

      if (error) throw new Error(error);

      // Update profile to reflect 2FA is enabled
      await supabase
        .from("profiles")
        .update({ two_factor_enabled: true })
        .eq("id", user?.id);

      setTwoFactorEnabled(true);
      setTwoFactorStatus("enabled");
      setPendingFactorId(null);
      setVerificationCode("");
      toast({
        title: "2FA enabled",
        description: "Two-factor authentication has been enabled successfully.",
      });
    } catch (error) {
      console.error("2FA verification error:", error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid verification code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSetup = () => {
    setTwoFactorStatus("off");
    setPendingFactorId(null);
    setVerificationCode("");
    setTwoFactorEnabled(false);
  };

  const handleSavePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        title: "All fields required",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      setPasswords({ current: "", new: "", confirm: "" });
      setShowPasswordFields(false);
    } catch (error) {
      console.error("Password change error:", error);
      toast({
        title: "Password update failed",
        description: error instanceof Error ? error.message : "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("settings.security_section.title")}</SheetTitle>
          <SheetDescription>
            {t("settings.security_section.description")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">{t("settings.security_section.fields.current_password")}</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("settings.security_section.fields.new_password")}</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("settings.security_section.fields.confirm_password")}</Label>
            <Input id="confirm-password" type="password" />
          </div>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>

        {isFetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Password Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Password</h3>
                <Button variant="outline" size="sm" onClick={() => setShowPasswordFields(!showPasswordFields)}>
                  {showPasswordFields ? "Hide" : "Change"}
                </Button>
              </div>

              {showPasswordFields && (
                <div className="space-y-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSavePassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* 2FA Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Two-factor authentication</h3>
                    {twoFactorEnabled && (
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable two-factor authentication for added security
                  </p>
                </div>
                {twoFactorStatus !== "verify" && (
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={() => {
                      if (twoFactorEnabled) {
                        // Turn off
                        supabase
                          .from("profiles")
                          .update({ two_factor_enabled: false })
                          .eq("id", user?.id)
                          .then(() => {
                            setTwoFactorEnabled(false);
                            setTwoFactorStatus("off");
                            toast({ title: "2FA disabled" });
                          });
                      } else {
                        // Turn on
                        handleToggle2FA();
                      }
                    }}
                    disabled={isLoading}
                  />
                )}
              </div>

              {/* Verification Code Input (when setting up 2FA) */}
              {twoFactorStatus === "verify" && (
                <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-blue-700 dark:text-blue-300">
                        Verify your identity
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        We sent a code to {user?.email}. Enter it below to complete setup.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="font-mono tracking-widest text-center text-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleVerifyCode} disabled={isLoading || verificationCode.length < 4}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Enable"
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancelSetup} disabled={isLoading}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {twoFactorStatus === "enabled" && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-xs text-green-700 dark:text-green-400">
                  ✓ Two-factor authentication is active on your account.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={isLoading || isFetching} onClick={() => {
            onSave();
            onClose();
          }}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};