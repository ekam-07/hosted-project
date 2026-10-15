import { createContext, useContext, useState } from 'react';

const BillContext = createContext(null);

export function BillProvider({ children }) {
  const [billItems, setBillItems] = useState([]);
  return <BillContext.Provider value={{ billItems, setBillItems }}>{children}</BillContext.Provider>;
}

export function useBill() {
  const context = useContext(BillContext);
  if (!context) throw new Error('useBill must be used inside BillProvider.');
  return context;
}

