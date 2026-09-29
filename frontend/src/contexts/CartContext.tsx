import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";


export interface CartCustomLine {
  label: string;
  amountDZD: number;
}

interface CartContextValue {
  spaceKey: string | null;
  packKey: string | null;
  optionKeys: string[];
  customLines: CartCustomLine[];
  holdExpiresAt: string | null;

  setSpaceKey: (spaceKey: string | null) => void;
  setPackKey: (packKey: string | null) => void;
  setOptionKeys: Dispatch<SetStateAction<string[]>>;
  setCustomLines: (customLines: CartCustomLine[]) => void;
  setHoldExpiresAt: (holdExpiresAt: string | null) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = "les-deux-anneaux-cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [spaceKey, setSpaceKey] = useState<string | null>(null);
  const [packKey, setPackKey] = useState<string | null>(null);
  const [optionKeys, setOptionKeys] = useState<string[]>([]);
  const [customLines, setCustomLines] = useState<CartCustomLine[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      return;
    }

    try {
      const cart = JSON.parse(savedCart) as {
        spaceKey?: string | null;
        packKey?: string | null;
        optionKeys?: string[];
        customLines?: CartCustomLine[];
        holdExpiresAt?: string | null;
      };

      setSpaceKey(cart.spaceKey || null);
      setPackKey(cart.packKey || null);
      setOptionKeys(cart.optionKeys || []);
      setCustomLines(cart.customLines || []);
      setHoldExpiresAt(cart.holdExpiresAt || null);
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        spaceKey,
        packKey,
        optionKeys,
        customLines,
        holdExpiresAt,
      })
    );
  }, [spaceKey, packKey, optionKeys, customLines, holdExpiresAt]);

  function clearCart() {
    setSpaceKey(null);
    setPackKey(null);
    setOptionKeys([]);
    setCustomLines([]);
    setHoldExpiresAt(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  const value = useMemo(
    () => ({
      spaceKey,
      packKey,
      optionKeys,
      customLines,
      holdExpiresAt,
      setSpaceKey,
      setPackKey,
      setOptionKeys,
      setCustomLines,
      setHoldExpiresAt,
      clearCart,
    }),
    [spaceKey, packKey, optionKeys, customLines, holdExpiresAt]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}