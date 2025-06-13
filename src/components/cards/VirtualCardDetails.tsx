import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  Copy,
  Calendar,
  ShieldCheck
} from "lucide-react";
import { getCardSensitiveDetails } from "@/services/virtualCardService";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface VirtualCardDetailsProps {
  card: any;
  onToggleLock: (cardId: string, isLocked: boolean) => void;
}

export function VirtualCardDetails({ card, onToggleLock }: VirtualCardDetailsProps) {
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Format card expiry date
  const formatExpiry = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };
  
  // Copy card details to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };
  
  // Toggle showing sensitive card details
  const toggleCardDetails = async () => {
    if (showCardDetails) {
      setShowCardDetails(false);
      return;
    }
    
    try {
      setLoadingDetails(true);
      const details = await getCardSensitiveDetails(card.id);
      setCardDetails(details);
      setShowCardDetails(true);
    } catch (error) {
      console.error('Failed to get card details:', error);
      toast({
        title: "Error",
        description: "Failed to load card details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingDetails(false);
    }
  };
  
  // Format card number with spaces
  const formatCardNumber = (number: string) => {
    return number.replace(/(\d{4})/g, '$1 ').trim();
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Card Details</CardTitle>
          <Badge variant={card.is_locked ? "outline" : "secondary"}>
            {card.is_locked ? "Locked" : "Active"}
          </Badge>
        </div>
        <CardDescription>
          Virtual card ending in {card.last4}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-56 bg-gradient-to-br from-primary to-primary/70 rounded-xl p-6 text-primary-foreground overflow-hidden shadow-lg">
          {/* Card background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 right-0 h-32 bg-white/20 rounded-full transform translate-y-[-60%] translate-x-[-10%] scale-150"></div>
            <div className="absolute bottom-0 right-0 h-32 w-32 bg-white/20 rounded-full transform translate-y-[30%] translate-x-[20%]"></div>
          </div>
          
          {/* Card content */}
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <CreditCard className="h-8 w-8" />
                <span className="font-bold text-xl">VortexCore</span>
              </div>
              <ShieldCheck className="h-6 w-6" />
            </div>
            
            <div className="space-y-4">
              {/* Card number */}
              <div>
                <p className="text-xs text-primary-foreground/70 mb-1">Card Number</p>
                {loadingDetails ? (
                  <Skeleton className="h-7 w-48 bg-white/20" />
                ) : showCardDetails && cardDetails ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-mono tracking-wider">
                      {formatCardNumber(cardDetails.number)}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                      onClick={() => copyToClipboard(cardDetails.number, 'Card number')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xl font-mono tracking-wider">
                    •••• •••• •••• {card.last4}
                  </p>
                )}
              </div>
              
              <div className="flex justify-between items-end">
                {/* Expiry date */}
                <div>
                  <p className="text-xs text-primary-foreground/70 mb-1">Expiry Date</p>
                  {loadingDetails ? (
                    <Skeleton className="h-6 w-16 bg-white/20" />
                  ) : showCardDetails && cardDetails ? (
                    <div className="flex items-center gap-2">
                      <p className="font-mono">
                        {formatExpiry(cardDetails.exp_month, cardDetails.exp_year)}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                        onClick={() => copyToClipboard(
                          formatExpiry(cardDetails.exp_month, cardDetails.exp_year), 
                          'Expiry date'
                        )}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="font-mono">••/••</p>
                  )}
                </div>
                
                {/* CVC */}
                <div>
                  <p className="text-xs text-primary-foreground/70 mb-1">CVC</p>
                  {loadingDetails ? (
                    <Skeleton className="h-6 w-12 bg-white/20" />
                  ) : showCardDetails && cardDetails ? (
                    <div className="flex items-center gap-2">
                      <p className="font-mono">{cardDetails.cvc}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                        onClick={() => copyToClipboard(cardDetails.cvc, 'CVC')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="font-mono">•••</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{card.status.charAt(0).toUpperCase() + card.status.slice(1)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(card.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Security</p>
            <p className="text-sm">
              This virtual card can be locked at any time to prevent unauthorized transactions.
              When locked, all payment attempts will be declined.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-4">
        <Button 
          variant="outline" 
          className="flex-1 gap-2"
          onClick={toggleCardDetails}
          disabled={loadingDetails}
        >
          {loadingDetails ? (
            <>
              <Skeleton className="h-4 w-4 rounded-full" />
              Loading...
            </>
          ) : showCardDetails ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Details
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Show Details
            </>
          )}
        </Button>
        
        <Button 
          variant={card.is_locked ? "default" : "outline"} 
          className={`flex-1 gap-2 ${card.is_locked ? "" : "text-destructive hover:text-destructive-foreground"}`}
          onClick={() => onToggleLock(card.id, card.is_locked)}
        >
          {card.is_locked ? (
            <>
              <Unlock className="h-4 w-4" />
              Unlock Card
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Lock Card
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}