"use client";

import { useUser } from "@clerk/nextjs";
import { createContext, useContext } from "react";

interface AppContextProps {
  children?: React.ReactNode;
}

const AppContext = createContext({});

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }: AppContextProps) => {
  const user = useUser();
  const value = {
    user,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
