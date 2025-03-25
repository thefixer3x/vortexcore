
import { 
  CreditCard, 
  Send, 
  Wallet, 
  DollarSign, 
  Building2,
  ArrowDownToLine
} from "lucide-react";

export const ValueAddedServices = () => {
  const services = [
    {
      icon: Send,
      title: "Send Money",
      description: "Fast transfers to local and international accounts"
    },
    {
      icon: ArrowDownToLine,
      title: "Receive Payments",
      description: "Get paid easily with multiple options"
    },
    {
      icon: CreditCard,
      title: "Virtual Card",
      description: "Create virtual cards for secure online shopping"
    },
    {
      icon: DollarSign,
      title: "Personal Credit",
      description: "Access instant financing when you need it"
    },
    {
      icon: Building2,
      title: "Business Financing",
      description: "Capital solutions for your growing business"
    },
    {
      icon: Wallet,
      title: "Multi-Currency",
      description: "Manage accounts in different currencies"
    }
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Value-Added Services</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {services.map((service, index) => (
          <div key={index} className="bg-muted/20 hover:bg-muted/30 transition-colors rounded-lg p-3 cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <service.icon className="h-5 w-5 text-primary" />
              <h4 className="font-medium">{service.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
