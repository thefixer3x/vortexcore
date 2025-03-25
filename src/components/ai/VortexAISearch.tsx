
import React, { useState } from "react";
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandGroup, 
  CommandItem 
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export function VortexAISearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const sections = [
    { name: "Control Room", path: "/dashboard", keywords: ["dashboard", "overview", "home", "accounts"] },
    { name: "Transactions", path: "/transactions", keywords: ["payments", "transfers", "history"] },
    { name: "VortexAI Insights", path: "/insights", keywords: ["analytics", "spending", "insights"] },
    { name: "Settings", path: "/settings", keywords: ["profile", "security", "preferences"] },
  ];

  const quickActions = [
    { name: "Transfer Money", action: () => {
      toast({
        title: "VortexAI",
        description: "Opening transfer money form...",
      });
      navigate("/transactions");
    }},
    { name: "Pay Bills", action: () => {
      toast({
        title: "VortexAI",
        description: "Opening bill payment form...",
      });
      navigate("/transactions");
    }},
    { name: "View Spending Analysis", action: () => {
      toast({
        title: "VortexAI",
        description: "Taking you to VortexAI insights...",
      });
      navigate("/insights");
    }},
  ];

  const navigateToSection = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 h-9 px-3 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search with VortexAI</span>
        <span className="inline md:hidden">Search</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Ask VortexAI anything..." />
        <CommandList>
          <CommandGroup heading="Navigate To">
            {sections.map((section) => (
              <CommandItem
                key={section.path}
                onSelect={() => navigateToSection(section.path)}
              >
                <Search className="mr-2 h-4 w-4" />
                {section.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Quick Actions">
            {quickActions.map((action, index) => (
              <CommandItem
                key={index}
                onSelect={action.action}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {action.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
