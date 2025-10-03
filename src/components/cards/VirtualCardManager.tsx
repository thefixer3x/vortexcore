import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getUserVirtualCards, 
  createUserVirtualCard,
  toggleCardLock,
  getCardTransactionHistory,
  formatTransaction
} from "@/services/virtualCardService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Plus, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShoppingBag
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VirtualCardDetails } from "./VirtualCardDetails";
import { VirtualCardForm } from "./VirtualCardForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function VirtualCardManager() {
  const { user } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  
  // Load user's virtual cards
  useEffect(() => {
    async function loadCards() {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const userCards = await getUserVirtualCards(user.id);
        setCards(userCards);
        
        // Select the first card by default if available
        if (userCards.length > 0 && !selectedCard) {
          setSelectedCard(userCards[0].id);
          loadTransactions(userCards[0].id);
        }
      } catch (error) {
        console.error('Failed to load virtual cards:', error);
        toast({
          title: "Error",
          description: "Failed to load your virtual cards. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadCards();
  }, [user?.id]);
  
  // Load transactions for selected card
  const loadTransactions = async (cardId: string) => {
    if (!cardId) return;
    
    try {
      setTransactionsLoading(true);
      const cardTransactions = await getCardTransactionHistory(cardId);
      setTransactions(cardTransactions.map(formatTransaction));
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTransactionsLoading(false);
    }
  };
  
  // Handle card creation
  const handleCreateCard = async (formData: any) => {
    if (!user?.id || !user?.email) {
      toast({
        title: "Error",
        description: "You must be logged in to create a virtual card.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Create spending limit object if values provided
      let spendingLimit;
      if (formData.limitAmount && formData.limitInterval) {
        spendingLimit = {
          amount: parseInt(formData.limitAmount) * 100, // Convert to cents
          interval: formData.limitInterval
        };
      }
      
      const newCard = await createUserVirtualCard(
        user.id,
        formData.name || user.name || user.email,
        user.email,
        formData.currency || 'usd',
        spendingLimit
      );
      
      setCards(prevCards => [newCard, ...prevCards]);
      setSelectedCard(newCard.id);
      setShowCardForm(false);
      
      toast({
        title: "Success",
        description: "Virtual card created successfully!",
      });
      
      // Load transactions for the new card
      loadTransactions(newCard.id);
    } catch (error) {
      console.error('Failed to create virtual card:', error);
      toast({
        title: "Error",
        description: "Failed to create virtual card. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle card lock/unlock
  const handleToggleLock = async (cardId: string, currentLockState: boolean) => {
    try {
      const updatedCard = await toggleCardLock(cardId, !currentLockState);
      
      // Update the cards state
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === cardId ? updatedCard : card
        )
      );
      
      toast({
        title: currentLockState ? "Card Unlocked" : "Card Locked",
        description: currentLockState 
          ? "Your virtual card has been unlocked and is now active." 
          : "Your virtual card has been locked for security.",
      });
    } catch (error) {
      console.error('Failed to toggle card lock:', error);
      toast({
        title: "Error",
        description: "Failed to update card status. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle card selection
  const handleSelectCard = (cardId: string) => {
    setSelectedCard(cardId);
    loadTransactions(cardId);
  };
  
  // Get the currently selected card
  const getSelectedCard = () => {
    return cards.find(card => card.id === selectedCard);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Virtual Cards</h2>
          <p className="text-muted-foreground">
            Create and manage your virtual cards for secure online payments
          </p>
        </div>
        
        <Dialog open={showCardForm} onOpenChange={setShowCardForm}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Virtual Card
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Virtual Card</DialogTitle>
              <DialogDescription>
                Create a new virtual card for secure online payments. You can set spending limits and lock the card anytime.
              </DialogDescription>
            </DialogHeader>
            <VirtualCardForm onSubmit={handleCreateCard} isLoading={loading} />
          </DialogContent>
        </Dialog>
      </div>
      
      {loading && cards.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/2 mb-1" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-40 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <CreditCard className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Virtual Cards</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              You haven't created any virtual cards yet. Create your first virtual card for secure online payments.
            </p>
            <Button onClick={() => setShowCardForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Virtual Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card List - Left Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Virtual Cards</h3>
            {cards.map((card) => (
              <Card 
                key={card.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCard === card.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectCard(card.id)}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      card.is_locked ? 'bg-muted' : 'bg-primary/10'
                    }`}>
                      <CreditCard className={`h-5 w-5 ${
                        card.is_locked ? 'text-muted-foreground' : 'text-primary'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">•••• {card.last4}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(card.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={card.is_locked ? "outline" : "secondary"}>
                    {card.is_locked ? "Locked" : "Active"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Card Details - Middle and Right Columns */}
          <div className="lg:col-span-2">
            {selectedCard ? (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Card Details</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <VirtualCardDetails 
                    card={getSelectedCard()} 
                    onToggleLock={handleToggleLock}
                  />
                </TabsContent>
                
                <TabsContent value="transactions">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Transaction History</CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => loadTransactions(selectedCard)}
                          disabled={transactionsLoading}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${
                            transactionsLoading ? 'animate-spin' : ''
                          }`} />
                          Refresh
                        </Button>
                      </div>
                      <CardDescription>
                        Recent transactions for card ending in {getSelectedCard()?.last4}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {transactionsLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-1">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                              <Skeleton className="h-4 w-20" />
                            </div>
                          ))}
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                          <h3 className="text-lg font-medium mb-1">No transactions yet</h3>
                          <p className="text-muted-foreground">
                            Transactions will appear here once you start using your card.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {transactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-muted">
                                  <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{transaction.merchant}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">
                                      {transaction.date} • {transaction.time}
                                    </p>
                                    <Badge variant="outline" className="text-xs">
                                      {transaction.status === 'pending' ? (
                                        <Clock className="h-3 w-3 mr-1" />
                                      ) : transaction.status === 'complete' ? (
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                      ) : (
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                      )}
                                      {transaction.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <p className={`font-medium ${
                                transaction.rawAmount < 0 ? 'text-green-600' : ''
                              }`}>
                                {transaction.amount}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Card Selected</h3>
                  <p className="text-muted-foreground mb-6">
                    Select a card from the list or create a new virtual card.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}