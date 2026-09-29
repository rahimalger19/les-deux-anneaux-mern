import { createContext, useState, type ReactNode } from "react";

export type Currency = "DZD" | "EUR" | "USD";

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
};

export const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    return (localStorage.getItem("currency") as Currency) || "DZD";
  });

  function changeCurrency(value: Currency) {
    localStorage.setItem("currency", value);
    setCurrency(value);
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}