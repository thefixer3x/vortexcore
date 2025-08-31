import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PaymentStatusContextType {
  paymentStatus: string;
  setPaymentStatus: (status: string) => void;
}

const PaymentStatusContext = createContext<PaymentStatusContextType | undefined>(undefined);

export const usePaymentStatus = () => {
  const context = useContext(PaymentStatusContext);
  if (context === undefined) {
    throw new Error('usePaymentStatus must be used within a PaymentStatusProvider');
  }
  return context;
};

interface PaymentStatusProviderProps {
  children: ReactNode;
}

export const PaymentStatusProvider: React.FC<PaymentStatusProviderProps> = ({ children }) => {
  const [paymentStatus, setPaymentStatus] = useState<string>('active');

  return (
    <PaymentStatusContext.Provider value={{ paymentStatus, setPaymentStatus }}>
      {children}
    </PaymentStatusContext.Provider>
  );
};
