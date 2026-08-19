import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface VirtualCardFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export function VirtualCardForm({ onSubmit, isLoading }: VirtualCardFormProps) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [enableLimit, setEnableLimit] = useState(false);
  const [limitAmount, setLimitAmount] = useState("");
  const [limitInterval, setLimitInterval] = useState<string>("monthly");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      name,
      currency,
      billing: {
        line1,
        city,
        state: state || undefined,
        postal_code: postalCode,
        country
      },
      limitAmount: enableLimit ? limitAmount : undefined,
      limitInterval: enableLimit ? limitInterval : undefined
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Cardholder Name</Label>
          <Input
            id="name"
            placeholder="Enter cardholder name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD - US Dollar</SelectItem>
              <SelectItem value="eur">EUR - Euro</SelectItem>
              <SelectItem value="gbp">GBP - British Pound</SelectItem>
              <SelectItem value="ngn">NGN - Nigerian Naira</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Billing address</Label>
          <p className="text-xs text-muted-foreground">Stripe requires this to issue a card.</p>
          <Input
            placeholder="Address line 1"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input placeholder="State / region" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Postal code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="NG">Nigeria</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="FR">France</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-limit">Spending Limit</Label>
            <Switch
              id="enable-limit"
              checked={enableLimit}
              onCheckedChange={setEnableLimit}
            />
          </div>
          
          {enableLimit && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="limit-amount">Amount</Label>
                <Input
                  id="limit-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="limit-interval">Interval</Label>
                <Select value={limitInterval} onValueChange={setLimitInterval}>
                  <SelectTrigger id="limit-interval">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="all_time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Virtual Card"}
        </Button>
      </div>
    </form>
  );
}