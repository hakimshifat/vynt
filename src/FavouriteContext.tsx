import React, { createContext, useContext, useState, useEffect } from "react";

interface FavouriteContextType {
  favourites: string[];
  toggleFavourite: (id: string) => void;
  isFavourite: (id: string) => boolean;
}

const FavouriteContext = createContext<FavouriteContextType | undefined>(undefined);

export const FavouriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("nike_clone_favourites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("nike_clone_favourites", JSON.stringify(favourites));
  }, [favourites]);

  const toggleFavourite = (id: string) => {
    setFavourites((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  const isFavourite = (id: string) => favourites.includes(id);

  return (
    <FavouriteContext.Provider value={{ favourites, toggleFavourite, isFavourite }}>
      {children}
    </FavouriteContext.Provider>
  );
};

export const useFavourites = () => {
  const context = useContext(FavouriteContext);
  if (!context) throw new Error("useFavourites must be used within FavouriteProvider");
  return context;
};
