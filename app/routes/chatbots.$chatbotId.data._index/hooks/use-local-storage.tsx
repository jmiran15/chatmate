// app/routes/chatbots.$chatbotId.data._index/hooks/use-local-storage.tsx

import { useEffect, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error("Error writing to localStorage:", error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return defaultValue;
  }
}

export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }
}
