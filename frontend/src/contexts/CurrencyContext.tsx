import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getPublicExchangeRates } from "../services/currency.service";

export type Currency = "DZD" | "EUR" | "USD";

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amountDZD: number) => string;
  ratesLoaded: boolean;
};

export const CurrencyContext =
  createContext<CurrencyContextType | null>(null);

const validCurrencies: Currency[] = ["DZD", "EUR", "USD"];

function getInitialCurrency(): Currency {
  const saved = localStorage.getItem("currency") as Currency | null;

  return saved && validCurrencies.includes(saved) ? saved : "DZD";
}

export function CurrencyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [currency, setCurrencyState] =
    useState<Currency>(getInitialCurrency);

  const [rates, setRates] = useState<
    Partial<Record<"EUR" | "USD", number>>
  >({});

  const [ratesLoaded, setRatesLoaded] = useState(false);

  useEffect(() => {
    getPublicExchangeRates()
      .then((data) => {
        setRates(
          Object.fromEntries(
            data.map((rate) => [rate.currency, rate.dzdPerUnit])
          )
        );
      })
      .catch(() => {
        setRates({});
      })
      .finally(() => {
        setRatesLoaded(true);
      });
  }, []);

  const setCurrency = useCallback((value: Currency) => {
    localStorage.setItem("currency", value);
    setCurrencyState(value);
  }, []);

  const formatPrice = useCallback(
    (amountDZD: number) => {
      if (currency === "DZD") {
        return new Intl.NumberFormat("fr-DZ", {
          style: "currency",
          currency: "DZD",
          maximumFractionDigits: 0,
        }).format(amountDZD);
      }

      const dzdPerUnit = rates[currency];

      if (!dzdPerUnit) {
        return new Intl.NumberFormat("fr-DZ", {
          style: "currency",
          currency: "DZD",
          maximumFractionDigits: 0,
        }).format(amountDZD);
      }

      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amountDZD / dzdPerUnit);
    },
    [currency, rates]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      formatPrice,
      ratesLoaded,
    }),
    [currency, setCurrency, formatPrice, ratesLoaded]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}