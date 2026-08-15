import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ThemeSheetProps {
  open: boolean;
  onClose: () => void;
}

type ThemeOption = {
  value: "light" | "dark" | "system";
  label: string;
  icon: string;
  description: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    icon: "☀️",
    description: "Bright theme for daytime use",
  },
  {
    value: "dark",
    label: "Dark",
    icon: "🌙",
    description: "Easier on the eyes at night",
  },
  {
    value: "system",
    label: "System",
    icon: "💻",
    description: "Follows your OS preference",
  },
];

export function ThemeSheet({ open, onClose }: ThemeSheetProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Appearance</SheetTitle>
          <SheetDescription>
            Choose how VortexCore looks on your device
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Theme
            </Label>
            <div className="grid gap-3">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setTheme(option.value);
                  }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                    theme === option.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {theme === option.value && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview hint */}
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs text-muted-foreground">
            Theme applies immediately. Changes are saved automatically.
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}