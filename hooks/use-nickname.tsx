import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "nickname";

interface NicknameContextValue {
  nickname: string;
  setNickname: (name: string) => void;
}

const NicknameContext = createContext<NicknameContextValue | null>(null);

export function NicknameProvider({ children }: { children: ReactNode }) {
  const [nickname, setNicknameState] = useState("User");

  useEffect(() => {
    let isActive = true;
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (isActive && saved) setNicknameState(saved);
    });
    return () => {
      isActive = false;
    };
  }, []);

  const setNickname = useCallback((name: string) => {
    setNicknameState(name);
    AsyncStorage.setItem(STORAGE_KEY, name);
  }, []);

  return createElement(
    NicknameContext.Provider,
    { value: { nickname, setNickname } },
    children,
  );
}

export function useNickname(): NicknameContextValue {
  const ctx = useContext(NicknameContext);
  if (!ctx) {
    throw new Error("useNickname must be used inside <NicknameProvider>");
  }
  return ctx;
}
