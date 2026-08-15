import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BadgeCheck, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ProfileSheet = ({ open, onClose, onSave }: ProfileSheetProps) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Form state — all fields controlled
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [incomeRange, setIncomeRange] = useState("");
  const [financialGoals, setFinancialGoals] = useState("");

  // Load profile data from Supabase when sheet opens
  useEffect(() => {
    if (!open || !isAuthenticated || !user?.id) return;

    const fetchProfile = async () => {
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        if (data) {
          setName(data.full_name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setOccupation(data.occupation || "");
          setIncomeRange(data.income_range || "");
          setFinancialGoals(data.financial_goals || "");
          setAvatarUrl(data.avatar_url || null);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [open, isAuthenticated, user?.id]);

  const handleSave = async () => {
    if (!isAuthenticated || !user?.id) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to save profile changes.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updates: Record<string, unknown> = {
        id: user.id,
        updated_at: new Date().toISOString(),
        full_name: name.trim(),
        phone: phone.trim() || null,
        occupation: occupation.trim() || null,
        income_range: incomeRange || null,
        financial_goals: financialGoals || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast({
          title: "Save failed",
          description: error.message || "Failed to save profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Also update Supabase auth user_metadata for consistency
      await supabase.auth.updateUser({
        data: { full_name: name.trim() },
      });

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Save failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(urlData.publicUrl);

      // Save URL to profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      console.error("Avatar upload failed:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAvatar = async () => {
    if (!avatarUrl || !user?.id) return;

    try {
      // Extract file path from URL
      const filePath = avatarUrl.split("/storage/v1/object/public/avatars/")[1];
      if (filePath) {
        await supabase.storage.from("avatars").remove([filePath]);
      }

      setAvatarUrl(null);
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      console.error("Avatar deletion failed:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("settings.profile.title")}</SheetTitle>
          <SheetDescription>
            {t("settings.profile.description")}
          </SheetDescription>
        </SheetHeader>

        {isFetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 p-4 rounded-xl border border-dashed border-muted">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {name.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                {avatarUrl && (
                  <button
                    onClick={handleDeleteAvatar}
                    className="text-sm text-destructive hover:text-destructive/80"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Volkov"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                  placeholder="you@example.com"
                  className="opacity-70"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* About You */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-medium">Tell Us About You</h3>
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="What do you do?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-range">Income Range</Label>
                <Select value={incomeRange} onValueChange={setIncomeRange}>
                  <SelectTrigger id="income-range">
                    <SelectValue placeholder="Select your income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="range1">₦100,000 - ₦500,000</SelectItem>
                    <SelectItem value="range2">₦500,001 - ₦1,000,000</SelectItem>
                    <SelectItem value="range3">₦1,000,001 - ₦5,000,000</SelectItem>
                    <SelectItem value="range4">₦5,000,001+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="financial-goals">Primary Financial Goals</Label>
                <Select value={financialGoals} onValueChange={setFinancialGoals}>
                  <SelectTrigger id="financial-goals">
                    <SelectValue placeholder="Select your primary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="investing">Investing</SelectItem>
                    <SelectItem value="retirement">Retirement Planning</SelectItem>
                    <SelectItem value="business">Business Growth</SelectItem>
                    <SelectItem value="debt">Debt Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Identity Verification */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-medium">Identity Verification</h3>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-medium">Verify Your Identity</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete KYC to access higher transaction limits
                    </p>
                  </div>
                </div>
                <Button>Start</Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={isLoading || isFetching}
            onClick={handleSave}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};