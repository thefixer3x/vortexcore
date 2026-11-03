import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search } from "lucide-react";
import { VortexAIIcon } from "@/components/ai/VortexAIIcon";

/** Ask the VortexAI assistant a question (answered by the real AI service). */
export const askVortexAI = (question: string) =>
  window.dispatchEvent(new CustomEvent("vortex:ask", { detail: question }));

export function VortexAISearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", keywords: ["control room", "accounts", "balance", "overview"] },
    { name: "Transactions", path: "/transactions", keywords: ["payments", "transfers", "history"] },
    { name: "Obligations", path: "/obligations", keywords: ["bills", "subscriptions", "due", "statement", "upload"] },
    { name: "VortexAI Insights", path: "/insights", keywords: ["insights", "analytics", "ai", "forecast"] },
    { name: "Settings", path: "/settings", keywords: ["profile", "security", "preferences", "plan", "billing"] },
  ];

  const close = () => { setOpen(false); setQuery(""); };
  const handleSelect = (path: string) => { navigate(path); close(); };
  const ask = () => { const q = query.trim(); if (!q) return; askVortexAI(q); close(); };

  const q = query.toLowerCase();
  const filteredItems = navItems.filter(
    (item) => item.name.toLowerCase().includes(q) || item.keywords.some((k) => k.includes(q)),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-[260px] justify-start gap-2 text-muted-foreground hidden md:flex">
          <Search className="h-4 w-4" />
          <span>Search or ask VortexAI...</span>
        </Button>
      </PopoverTrigger>
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search or ask VortexAI" onClick={() => setOpen(true)}>
        <Search className="h-5 w-5" />
      </Button>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Ask VortexAI or jump to a page..." value={query} onValueChange={setQuery} />
          <CommandList>
            {query.trim() && (
              <CommandGroup heading="VortexAI">
                <CommandItem value={`ask-${query}`} onSelect={ask} className="gap-2">
                  <VortexAIIcon className="h-4 w-4 text-primary" />
                  <span className="truncate">Ask VortexAI: “{query.trim()}”</span>
                </CommandItem>
              </CommandGroup>
            )}
            {filteredItems.length > 0 && (
              <CommandGroup heading="Pages">
                {filteredItems.map((item) => (
                  <CommandItem key={item.path} value={item.path} onSelect={() => handleSelect(item.path)}>
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
