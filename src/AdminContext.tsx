/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState } from "react";
import { sha256 } from "js-sha256";

interface AdminContextType {
  isAdmin: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// SHA-256 of "Admin@Vynt2024"
const ADMIN_HASH = "ba7d7ca2efe6812edb819e69db981e4e9a1e9a4231e244fcb72c9922ef0e6186";

const SESSION_KEY = "vynt-admin-session";

// Replaced with js-sha256 library

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(SESSION_KEY) === "true";
  });

  const login = async (password: string): Promise<boolean> => {
    try {
      const hash = sha256(password);
      if (hash === ADMIN_HASH) {
        setIsAdmin(true);
        localStorage.setItem(SESSION_KEY, "true");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within an AdminProvider");
  return ctx;
};
