
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, Sparkles } from "lucide-react";

export function VortexAISearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", keywords: ["control room", "accounts", "balance", "overview"] },
    { name: "Transactions", path: "/transactions", keywords: ["payments", "transfers", "history"] },
    { name: "VortexAI", path: "/insights", keywords: ["insights", "analytics", "ai", "forecast"] },
    { name: "Settings", path: "/settings", keywords: ["profile", "security", "preferences"] },
  ];

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  const filteredItems = navItems.filter(
    item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-[260px] justify-start gap-2 text-muted-foreground hidden md:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search with VortexAI...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Sparkles className="mr-2 h-4 w-4 shrink-0 text-primary" />
            <CommandInput
              placeholder="Ask VortexAI..."
              value={query}
              onValueChange={setQuery}
              className="flex-1 border-0 focus-visible:ring-0"
            />
          </div>
          <CommandList>
            <CommandGroup heading="Suggestions">
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.path}
                  onSelect={() => handleSelect(item.path)}
                >
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
