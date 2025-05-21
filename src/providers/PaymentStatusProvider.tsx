import React, { createContext } from 'react';

export const PaymentStatusContext = createContext(null);

export function PaymentStatusProvider({ children }) {
  return (
    <PaymentStatusContext.Provider value={{}}>
      {children}
    </PaymentStatusContext.Provider>
  );
}