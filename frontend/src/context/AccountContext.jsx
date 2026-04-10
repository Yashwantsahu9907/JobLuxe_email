import React, { createContext, useContext, useState, useEffect } from 'react';

const AccountContext = createContext();

export const useAccount = () => useContext(AccountContext);

export const AccountProvider = ({ children }) => {
  const [activeAccount, setActiveAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const refreshAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`);
      const data = await response.json();
      setAccounts(data);
      const active = data.find(acc => acc.isActive);
      setActiveAccount(active || null);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAccounts();
  }, []);

  return (
    <AccountContext.Provider value={{ activeAccount, accounts, isLoading, refreshAccounts }}>
      {children}
    </AccountContext.Provider>
  );
};
