import React, { createContext, useContext, useState, useEffect } from "react";

interface NavigationContextType {
  currentPath: string;
  searchParams: URLSearchParams;
  setSearchParams: (params: Record<string, string> | URLSearchParams) => void;
  navigate: (path: string, params?: Record<string, string>) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  // Read hash or default to active route
  const getHashParts = () => {
    const hash = window.location.hash || "#/";
    const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
    const [pathPart, queryPart] = cleaned.split("?");
    return {
      path: pathPart || "/",
      query: new URLSearchParams(queryPart || "")
    };
  };

  const [currentPath, setCurrentPath] = useState(() => getHashParts().path);
  const [searchParams, setSearchParamsState] = useState(() => getHashParts().query);

  const navigate = (path: string, params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    window.location.hash = `#${path}${query}`;
  };

  const setSearchParams = (params: Record<string, string> | URLSearchParams) => {
    const queryStr = params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString();
    const query = queryStr ? "?" + queryStr : "";
    window.location.hash = `#${currentPath}${query}`;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const parts = getHashParts();
      setCurrentPath(parts.path);
      setSearchParamsState(parts.query);
    };

    window.addEventListener("hashchange", handleHashChange);
    // Initial trigger
    if (!window.location.hash) {
      window.location.hash = "#/";
    }
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <NavigationContext.Provider value={{ currentPath, searchParams, setSearchParams, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
export default NavigationProvider;
