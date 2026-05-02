/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ShippingConfig {
  insideDhaka: number;
  outsideDhaka: number;
}

interface ShippingContextType {
  shipping: ShippingConfig;
  updateShipping: (config: ShippingConfig) => void;
}

const DEFAULT_SHIPPING: ShippingConfig = {
  insideDhaka: 80,
  outsideDhaka: 150,
};

const STORAGE_KEY = "vynt_shipping_config";

const ShippingContext = createContext<ShippingContextType>({
  shipping: DEFAULT_SHIPPING,
  updateShipping: () => {},
});

export const ShippingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shipping, setShipping] = useState<ShippingConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_SHIPPING;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipping));
  }, [shipping]);

  const updateShipping = (config: ShippingConfig) => {
    setShipping(config);
  };

  return (
    <ShippingContext.Provider value={{ shipping, updateShipping }}>
      {children}
    </ShippingContext.Provider>
  );
};

export const useShipping = () => useContext(ShippingContext);
