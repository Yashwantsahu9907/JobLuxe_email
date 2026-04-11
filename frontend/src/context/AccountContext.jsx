import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AccountContext = createContext();

export const useAccount = () => useContext(AccountContext);

export const AccountProvider = ({ children }) => {
  const [activeAccount, setActiveAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  const refreshAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts`);
      const data = response.data;
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
