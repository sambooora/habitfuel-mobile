import { createContext, useContext } from "react";

interface SplashContextValue {
  splashDone: boolean;
}

const SplashContext = createContext<SplashContextValue>({ splashDone: false });

export const SplashProvider = SplashContext.Provider;

export function useSplashDone() {
  return useContext(SplashContext).splashDone;
}
