/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

interface AdminContextType {
  isAdmin: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_LOGIN_EMAIL;

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(data.session?.user.email === ADMIN_EMAIL);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user.email === ADMIN_EMAIL);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (password: string): Promise<boolean> => {
    if (!ADMIN_EMAIL) {
      console.error("[Admin] Missing VITE_ADMIN_LOGIN_EMAIL.");
      return false;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });

    if (error || data.user?.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      return false;
    }

    setIsAdmin(true);
    return true;
  };

  const logout = () => {
    setIsAdmin(false);
    supabase.auth.signOut();
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
