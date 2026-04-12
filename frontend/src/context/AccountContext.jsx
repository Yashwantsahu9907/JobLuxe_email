import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AccountContext = createContext();

export const useAccount = () => useContext(AccountContext);

export const AccountProvider = ({ children }) => {
  const [activeAccount, setActiveAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccounts = async () => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get('/api/accounts');
      const data = response.data;
      setAccounts(data);
      const active = data.find(acc => acc.isActive);
      setActiveAccount(active || null);
    } catch (error) {
      // Only log if it's not a 401 (which is expected when not logged in)
      if (error.response?.status !== 401) {
        console.error('Failed to fetch accounts:', error);
      }
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
