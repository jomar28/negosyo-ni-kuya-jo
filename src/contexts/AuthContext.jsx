import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  // Check local storage on load so login persists on refresh
  useEffect(() => {
    const storedAuth = localStorage.getItem('kuyaJoAuth');
    if (storedAuth === 'true') setIsAdmin(true);
  }, []);

  const login = (username, pin) => {
    // UPDATED: Check for both username and pin
    // We'll hardcode 'admin' as the user for now
    if (username.toLowerCase() === 'jomar' && pin === 'master') { 
      setIsAdmin(true);
      localStorage.setItem('kuyaJoAuth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('kuyaJoAuth');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}