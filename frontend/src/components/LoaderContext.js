import React, { createContext, useContext, useState, useCallback } from 'react';

const LoaderContext = createContext();

export function LoaderProvider({ children }) {
  const [loading, setLoading] = useState(false);

  // Show loader for at least 0.5s, but allow manual hide
  const showLoader = useCallback(() => {
    setLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setTimeout(() => setLoading(false), 0); // allow React event loop to finish
  }, []);

  return (
    <LoaderContext.Provider value={{ loading, showLoader, hideLoader }}>
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  return useContext(LoaderContext);
}
