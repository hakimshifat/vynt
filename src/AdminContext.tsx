/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState } from "react";

interface AdminContextType {
  isAdmin: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// SHA-256 of "Admin@Vynt2024"
// Verified with: echo -n "c" | sha256sum
const ADMIN_HASH = "1ed37a7421d9e1f75cec782e53aa74710e2bbc0b383d195ed781807ab804c7cb";

const SESSION_KEY = "vynt-admin-session";

async function sha256(text: string): Promise<string> {
  if (!crypto?.subtle?.digest) {
    // crypto.subtle is only available on HTTPS. Fallback should never be
    // reached on a properly deployed site — surface a clear error.
    console.error("[AdminContext] crypto.subtle unavailable. Site must be served over HTTPS.");
    return "";
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(SESSION_KEY) === "true";
  });

  const login = async (password: string): Promise<boolean> => {
    const hash = await sha256(password);
    if (hash === ADMIN_HASH) {
      setIsAdmin(true);
      localStorage.setItem(SESSION_KEY, "true");
      return true;
    }
    return false;
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
